import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';

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
    private readonly gemini: GeminiService,
  ) {}

  /**
   * Generates embeddings and indexes all translated paragraphs on a page into Translation Memory.
   */
  async indexPage(pageId: string): Promise<void> {
    this.logger.log(`Starting Translation Memory indexing for page ${pageId}`);

    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: {
        project: true,
      },
    });

    if (!page || !page.originalHtml || !page.translatedHtml) {
      this.logger.warn(`Failed to index page ${pageId}: page, originalHtml, or translatedHtml not found`);
      return;
    }

    const { project, originalHtml, translatedHtml } = page;

    // Split HTML-lite strings on paragraph tags to get paragraph texts, stripping residual tags
    const originalParas = originalHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi)?.map(p => p.replace(/<[^>]+>/g, '').trim()).filter(Boolean) || [];
    const translatedParas = translatedHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi)?.map(p => p.replace(/<[^>]+>/g, '').trim()).filter(Boolean) || [];

    // Clean out old Translation Memory references for this specific page first (idempotence)
    await this.prisma.translationMemory.deleteMany({
      where: { pageId },
    });

    const minLength = Math.min(originalParas.length, translatedParas.length);
    for (let i = 0; i < minLength; i++) {
      const origText = originalParas[i];
      const transText = translatedParas[i];

      if (!origText || !transText) {
        continue;
      }

      try {
        this.logger.log(`Indexing paragraph ${i} from page ${page.id} into TM`);

        // 1. Generate 768-dimensional embedding using Google's text-embedding-004
        const embedding = await this.gemini.getEmbedding768(origText);

        if (!embedding || embedding.length !== 768) {
          throw new Error(`Invalid embedding length generated: ${embedding?.length ?? 0}`);
        }

        // 2. Save translation memory database record
        const tm = await this.prisma.translationMemory.create({
          data: {
            pageId: page.id,
            projectId: project.id,
            styleGuideId: project.styleGuideId,
            sourceLang: project.sourceLang,
            targetLang: project.targetLang,
            originalText: origText,
            translatedText: transText,
          },
        });

        // 3. Update the pgvector field using raw SQL
        const vectorStr = `[${embedding.join(',')}]`;
        await this.prisma.$executeRawUnsafe(
          `UPDATE "TranslationMemory" SET embedding = $1::vector WHERE id = $2`,
          vectorStr,
          tm.id,
        );

        this.logger.log(`Successfully indexed paragraph ${i} with embedding`);
      } catch (error) {
        this.logger.error(`Failed to index paragraph ${i} on page ${page.id}: ${(error as Error).message}`);
      }
    }

    this.logger.log(`Completed Translation Memory indexing for page ${pageId}`);
  }

  /**
   * Retrieves top 3 matching translated sentences/paragraphs matching the exact genre, language, and similarity threshold.
   */
  async retrieve(
    originalText: string,
    styleGuideId: string,
    sourceLang: string,
    targetLang: string,
    limit = 3,
  ): Promise<MemoryMatch[]> {
    try {
      this.logger.log(`Retrieving Translation Memory matches for: "${originalText.slice(0, 30)}..."`);

      const embedding = await this.gemini.getEmbedding768(originalText);

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
          WHERE "styleGuideId" = $2
           AND "sourceLang" = $3
           AND "targetLang" = $4
           AND embedding IS NOT NULL
           AND 1 - (embedding <=> $1::vector) >= 0.75
         ORDER BY embedding <=> $1::vector ASC
         LIMIT $5`,
        vectorStr,
        styleGuideId,
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
