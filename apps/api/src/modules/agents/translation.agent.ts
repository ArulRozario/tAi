import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryService } from './memory.service';
import { GeminiService } from './gemini.service';
import { MinIOService } from '../files/minio.service';

export interface PageTranslationResult {
  pageId: string;
  originalHtml: string;
  translatedHtml: string;
  borrowedText?: string;
  isNewChapter?: boolean;
  chapterNumber?: number;
}

@Injectable()
export class TranslationAgent {
  private readonly logger = new Logger(TranslationAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly memoryService: MemoryService,
    private readonly gemini: GeminiService,
    private readonly minio: MinIOService,
  ) {}

  /**
   * Main entrypoint to visually translate a sliding batch of pages.
   */
  async translateBatch(
    projectId: string,
    pageIds: string[],
  ): Promise<PageTranslationResult[]> {
    this.logger.log(`Executing visual page translation batch of ${pageIds.length} pages for project ${projectId}`);

    // 1. Fetch project context, language pair, genre, and style guides
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
    const genreStyleGuide = project.genre.currentVersion?.content || 'Standard theological formal register.';

    // 2. Fetch top 50 glossary terms for this genre
    const glossaryTerms = await this.prisma.glossaryTerm.findMany({
      where: { genreId: project.genreId },
      take: 50,
      orderBy: { sourceTerm: 'asc' },
    });

    const glossaryBlock = glossaryTerms
      .map((term) => `- ${term.sourceTerm} → ${term.targetTerm} (${term.context || 'general'})`)
      .join('\n');

    // 3. Load pages in exact order
    const pages = await this.prisma.page.findMany({
      where: { id: { in: pageIds } },
      orderBy: { pageNumber: 'asc' },
    });

    if (pages.length === 0) {
      this.logger.warn(`No pages found in translation batch pageIds: ${pageIds.join(', ')}`);
      return [];
    }

    // Determine target pages versus context page
    // If we have 4 pages, targetPages = pages[0,1,2], contextPage = pages[3]
    const hasContextPage = pages.length > 3;
    const targetPages = hasContextPage ? pages.slice(0, 3) : pages;
    const contextPage = hasContextPage ? pages[3] : null;

    const results: PageTranslationResult[] = [];

    // Translate target pages sequentially to pass the sliding boundary context dynamically!
    for (let i = 0; i < targetPages.length; i++) {
      const page = targetPages[i];
      this.logger.log(`Translating target page ${page.pageNumber} (ID: ${page.id})`);

      // Retrieve previous sliding boundary borrowed-text from the page's metadata
      const translationMetadata = (page.translationMetadata as any) || {};
      const ignoreFromTopOfPage = translationMetadata.borrowedTextFromNextPage || null;

      // Build RAG block for this specific page if we have some original text reference
      const searchRefText = page.originalHtml || '';
      let tmBlock = 'No past approved translations found for this page.';
      if (searchRefText.trim()) {
        const matches = await this.memoryService.retrieve(
          searchRefText.slice(0, 200),
          project.genreId,
          sourceLang,
          targetLang,
          3,
        );
        if (matches.length > 0) {
          tmBlock = matches
            .map((m) => `Source: "${m.originalText}"\nApproved: "${m.translatedText}"`)
            .join('\n---\n');
        }
      }

      // Download page visual image from MinIO
      let pageImageBase64 = '';
      const objectKey = `projects/${project.id}/pages/${page.pageNumber}.png`;
      try {
        const buffer = await this.minio.downloadFile(objectKey);
        // If it's a mock file, check if it's just 'MOCK_PAGE_IMAGE'
        if (buffer.toString('utf-8').startsWith('MOCK_')) {
          throw new Error('Mock placeholder image detected. Falling back to text prompt.');
        }
        pageImageBase64 = buffer.toString('base64');
      } catch (err) {
        this.logger.warn(`Direct visual image load failed for Page ${page.pageNumber}: ${(err as Error).message}. Using transparent fallback PNG.`);
        // Fallback tiny transparent 1x1 PNG so the API doesn't fail
        pageImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      }

      // Build specific visual context prompts
      const ignoreContextInstruction = ignoreFromTopOfPage
        ? `\n[SLIDING WINDOW NOTICE]\nThe preceding page already translated this cut-off sentence fragment from the top of this page: "${ignoreFromTopOfPage}". Do not re-translate or repeat this text at the beginning of your translatedHtml, but transcribe it in originalHtml for completeness.\n`
        : '';

      const systemPrompt = `You are an expert professional translator and high-fidelity book typographer.
Your task is to transcribe and translate the scanned book page image provided, from ${sourceLang} to ${targetLang}.

## Style Guide
Follow the rules, terminology, and tone defined in the style guide below.
When in doubt, prefer the terms and phrasing specified in the style guide over general usage.

[GENRE_CONTENT_CACHE_BLOCK]
${genreStyleGuide}
[/GENRE_CONTENT_CACHE_BLOCK]

[GLOSSARY_CACHE_BLOCK]
${glossaryBlock || 'No glossary terms defined.'}
[/GLOSSARY_CACHE_BLOCK]

[TRANSLATION_MEMORY_BLOCK]
## Past Approved Translations (use as reference)
${tmBlock}
[/TRANSLATION_MEMORY_BLOCK]

## Typography Rules (Sanitized HTML-lite)
You must preserve all print typography natively in your transcription (originalHtml) and translation (translatedHtml) using ONLY the following safe HTML tags:
1. Bold: <b>text</b>
2. Italic: <i>text</i>
3. Underline: <u>text</u>
4. Superscripts (Verse Numbers / Citation Markers): <sup>12</sup>
5. Colors/Highlights: <span style="background-color: #HEX;">text</span>
6. Alignment: <p align="center|right|left">text</p>

Do not generate any other HTML tags, styles, classes, or structures. Ensure all tags are properly closed and nested.
`;

      const userPrompt = `Please transcribe and translate the attached image for Page ${page.pageNumber}.
${ignoreContextInstruction}
${page.originalHtml ? `[PAGE TEXT REFERENCE]\n${page.originalHtml}\n[/PAGE TEXT REFERENCE]` : ''}
${contextPage ? `\n[NEXT PAGE PREVIEW CONTEXT (READ-ONLY)]\nFor visual continuity, the next page (Page ${contextPage.pageNumber}) starts with: "${contextPage.originalHtml || 'scanned layout'}". If a sentence is split across the bottom boundary, use this context to borrow text and complete the sentence elegantly, and flag it in 'borrowedTextFromNextPage'.` : ''}

Output the structured JSON response containing:
1. 'originalHtml' (English HTML-lite visual transcription)
2. 'translatedHtml' (Tamil HTML-lite visual translation)
3. 'boundaryMetadata' (defining any borrowed text from the next page preview)
4. 'isNewChapter' & 'chapterNumber' (if page starts a new chapter)
`;

      // Call Gemini structured content generator
      const translation = await this.gemini.translatePageVisual(pageImageBase64, `${systemPrompt}\n\n${userPrompt}`);

      results.push({
        pageId: page.id,
        originalHtml: translation.originalHtml,
        translatedHtml: translation.translatedHtml,
        borrowedText: translation.boundaryMetadata?.borrowedTextFromNextPage,
        isNewChapter: translation.isNewChapter,
        chapterNumber: translation.chapterNumber,
      });

      // If this target page borrowed text from the next page, write it to the next page's translationMetadata immediately!
      // This ensures that when the loop processes the next page (either in this batch or the next batch), it respects the boundary!
      if (translation.boundaryMetadata?.borrowedTextFromNextPage && i + 1 < pages.length) {
        const nextPage = pages[i + 1];
        const nextMeta = (nextPage.translationMetadata as any) || {};
        nextMeta.borrowedTextFromNextPage = translation.boundaryMetadata.borrowedTextFromNextPage;

        await this.prisma.page.update({
          where: { id: nextPage.id },
          data: { translationMetadata: nextMeta },
        });
        // Update local object as well
        nextPage.translationMetadata = nextMeta;
      }
    }

    return results;
  }
}