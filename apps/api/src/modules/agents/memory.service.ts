import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from './ollama.service';

export interface MemoryMatch {
  originalText: string;
  translatedText: string;
  similarity: number;
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaService,
  ) {}

  /**
   * Generates embeddings and indexes all translated sentences on a page into Translation Memory.
   */
  async indexPage(pageId: string): Promise<void> {
    this.logger.log(`Starting Translation Memory indexing for page ${pageId}`);

    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: {
        project: true,
        sentences: {
          where: {
            translatedText: { not: null },
          },
        },
      },
    });

    if (!page) {
      this.logger.error(`Failed to index page ${pageId}: page not found`);
      return;
    }

    const { project, sentences } = page;

    for (const sentence of sentences) {
      if (!sentence.originalText || !sentence.translatedText) {
        continue;
      }

      try {
        this.logger.log(`Indexing sentence ${sentence.id} into TM`);

        // 1. Generate 768-dimensional embedding
        const embedding = await this.ollama.getEmbedding(sentence.originalText, 'nomic-embed-text');

        if (!embedding || embedding.length !== 768) {
          throw new Error(`Invalid embedding length generated: ${embedding?.length ?? 0}`);
        }

        // 2. Upsert standard database record (excluding vector)
        const tm = await this.prisma.translationMemory.upsert({
          where: { sentenceId: sentence.id },
          create: {
            sentenceId: sentence.id,
            projectId: project.id,
            genreId: project.genreId,
            sourceLang: project.sourceLang,
            targetLang: project.targetLang,
            originalText: sentence.originalText,
            translatedText: sentence.translatedText,
          },
          update: {
            translatedText: sentence.translatedText,
          },
        });

        // 3. Update the pgvector field using raw SQL
        const vectorStr = `[${embedding.join(',')}]`;
        await this.prisma.$executeRawUnsafe(
          `UPDATE "TranslationMemory" SET embedding = $1::vector WHERE id = $2`,
          vectorStr,
          tm.id,
        );

        this.logger.log(`Successfully indexed sentence ${sentence.id} with embedding`);
      } catch (error) {
        this.logger.error(`Failed to index sentence ${sentence.id} in TM: ${(error as Error).message}`);
      }
    }

    this.logger.log(`Completed Translation Memory indexing for page ${pageId}`);
  }

  /**
   * Retrieves top 3 matching translated sentences matching the exact genre, language, and similarity threshold.
   */
  async retrieve(
    originalText: string,
    genreId: string,
    sourceLang: string,
    targetLang: string,
    limit: number = 3,
  ): Promise<MemoryMatch[]> {
    try {
      this.logger.log(`Retrieving Translation Memory matches for: "${originalText.slice(0, 30)}..."`);

      const embedding = await this.ollama.getEmbedding(originalText, 'nomic-embed-text');

      if (!embedding || embedding.length !== 768) {
        this.logger.warn(`Failed to generate valid embedding for TM search`);
        return [];
      }

      const vectorStr = `[${embedding.join(',')}]`;

      // SQL statement executing cosine similarity using the pgvector <=> operator
      // similarity = 1 - cosine_distance
      const results = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT "originalText", "translatedText",
                1 - (embedding <=> $1::vector) AS similarity
         FROM "TranslationMemory"
         WHERE "genreId" = $2
           AND "sourceLang" = $3
           AND "targetLang" = $4
           AND embedding IS NOT NULL
           AND 1 - (embedding <=> $1::vector) >= 0.75
         ORDER BY embedding <=> $1::vector ASC
         LIMIT $5`,
        vectorStr,
        genreId,
        sourceLang,
        targetLang,
        limit,
      );

      const matches = results.map(r => ({
        originalText: r.originalText as string,
        translatedText: r.translatedText as string,
        similarity: Number(r.similarity),
      }));

      this.logger.log(`Found ${matches.length} matches in Translation Memory`);
      return matches;
    } catch (error) {
      this.logger.error(`Error retrieving Translation Memory matches: ${(error as Error).message}`);
      return [];
    }
  }
}
