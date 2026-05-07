import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModelsService } from '../models/models.service';
import { MemoryService } from './memory.service';
import { AgentType } from '@prisma/client';

export interface TranslationInput {
  id: string;
  text: string;
}

export interface TranslationOutput {
  id: string;
  translatedText: string;
  confidence: number;
}

@Injectable()
export class TranslationAgent {
  private readonly logger = new Logger(TranslationAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly modelsService: ModelsService,
    private readonly memoryService: MemoryService,
  ) {}

  /**
   * Main entrypoint to translate a batch of sentences.
   */
  async translateBatch(
    projectId: string,
    sentences: TranslationInput[],
    pageIds: string[],
  ): Promise<TranslationOutput[]> {
    this.logger.log(`Translating batch of ${sentences.length} sentences for project ${projectId}`);

    // 1. Fetch project, language context, and genre
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        genre: {
          include: {
            currentVersion: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const sourceLang = project.sourceLang;
    const targetLang = project.targetLang;
    const genreContent = project.genre.currentVersion?.content || 'Standard formal tone style guide.';

    // 2. Fetch top 50 glossary terms for this genre
    const glossaryTerms = await this.prisma.glossaryTerm.findMany({
      where: { genreId: project.genreId },
      take: 50,
      orderBy: { sourceTerm: 'asc' },
    });

    const glossaryBlock = glossaryTerms
      .map((term) => `${term.sourceTerm} → ${term.targetTerm}`)
      .join('\n');

    // 3. Build Translation Memory (RAG) Block
    // Retrieve past approved translations for contextually similar sentences
    const tmResults: string[] = [];
    for (const sent of sentences.slice(0, 5)) { // Search for first few to avoid overloading embeddings
      const matches = await this.memoryService.retrieve(sent.text, project.genreId, sourceLang, targetLang, 1);
      if (matches.length > 0) {
        tmResults.push(`Source: "${matches[0].originalText}"\nApproved translation: "${matches[0].translatedText}"`);
      }
    }

    const tmBlock = tmResults.length > 0 
      ? tmResults.join('\n---\n') 
      : 'No past approved translations found for this block.';

    // 4. Build Document Context Blocks for each Page
    const pages = await this.prisma.page.findMany({
      where: { id: { in: pageIds } },
      orderBy: { pageNumber: 'asc' },
      include: {
        sentences: {
          orderBy: { sentenceNumber: 'asc' },
        },
      },
    });

    let documentContext = '';
    for (const page of pages) {
      if (page.sourceMarkdown) {
        let reconstructedText = page.sourceMarkdown;
        for (const s of page.sentences) {
          reconstructedText = reconstructedText.replace(`{{SENTENCE_${s.sentenceNumber}}}`, s.originalText || '');
        }
        documentContext += `[PAGE ${page.pageNumber}]\n${reconstructedText}\n[/PAGE ${page.pageNumber}]\n\n`;
      }
    }

    // 5. Construct System Prompt
    const systemPrompt = `You are an expert professional translator.
Translate the provided ${sourceLang} text into ${targetLang}.

## Style Guide
Follow the rules, terminology, and tone defined in the style guide below.
When in doubt, prefer the terms and phrasing specified in the style guide over general usage.

[GENRE_CONTENT_CACHE_BLOCK]
${genreContent}
[/GENRE_CONTENT_CACHE_BLOCK]

[GLOSSARY_CACHE_BLOCK]
${glossaryBlock || 'No glossary terms defined.'}
[/GLOSSARY_CACHE_BLOCK]

[TRANSLATION_MEMORY_BLOCK]
## Past Approved Translations (use as reference)
These are human-verified translations of similar source text in this genre.
Use them to maintain consistency with previously approved style and terminology.
Do NOT copy them verbatim — apply them only where the source text is genuinely similar.

${tmBlock}
[/TRANSLATION_MEMORY_BLOCK]

The user message will include a [DOCUMENT_CONTEXT] block for each source page in the batch.
Use it to understand each sentence's structural role (heading, bullet, paragraph, caption) and
to maintain coherence and terminology consistency across all pages in the batch.
Translate only the sentences listed in the JSON array — do not translate the context block itself.

Output a strict JSON array. Do not output anything else.

Format:
\`\`\`json
[
  {"id": "sent-1", "translatedText": "..."}
]
\`\`\``;

    // 6. Construct User Prompt
    const userPrompt = `[DOCUMENT_CONTEXT]
${documentContext.trim()}
[/DOCUMENT_CONTEXT]

Translate the following ${sourceLang} sentences into ${targetLang}.
Use the document context above to inform register, structural role, and terminology consistency:

\`\`\`json
${JSON.stringify(
  sentences.map((s) => ({ id: s.id, text: s.text })),
  null,
  2,
)}
\`\`\``;

    // 7. Call LLM Service
    const response = await this.modelsService.executePrompt(AgentType.TRANSLATION, `${systemPrompt}\n\n${userPrompt}`, {
      temperature: 0.3,
      max_tokens: 4096,
    });

    // 8. Parse JSON response safely
    try {
      const textResponse = response.text.trim();
      const jsonMatch = textResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      if (!jsonMatch) {
        throw new Error(`Failed to extract JSON array from translation response. Response content: ${textResponse}`);
      }

      const parsed = JSON.parse(jsonMatch[0]) as any[];

      // Validate parsed array structure
      const outputs: TranslationOutput[] = parsed.map((item) => {
        if (!item.id || !item.translatedText) {
          throw new Error('Invalid translated sentence output item: missing "id" or "translatedText"');
        }
        return {
          id: item.id,
          translatedText: item.translatedText,
          confidence: 0.9, // Default confidence score
        };
      });

      return outputs;
    } catch (parseErr) {
      this.logger.error(`Failed parsing translation response: ${(parseErr as Error).message}`);
      throw parseErr;
    }
  }
}