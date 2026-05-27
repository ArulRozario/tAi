import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryService } from './memory.service';
import { GeminiService } from './gemini.service';
import { MinIOService } from '../files/minio.service';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface PageTranslationResult {
  pageId: string;
  originalHtml: string;
  translatedHtml: string;
  borrowedText?: string;
  isNewChapter?: boolean;
  chapterNumber?: number;
  incompleteSentenceAtEnd?: string;
  modelUsed: string;
}

@Injectable()
export class TranslationAgent {
  private readonly logger = new Logger(TranslationAgent.name);
  private readonly promptTemplate: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly memoryService: MemoryService,
    private readonly gemini: GeminiService,
    private readonly minio: MinIOService,
  ) {
    const promptPath = [
      join(__dirname, 'translation-prompt.md'),
      join(__dirname, '..', '..', '..', 'src', 'modules', 'agents', 'translation-prompt.md'),
      join(process.cwd(), 'apps', 'api', 'src', 'modules', 'agents', 'translation-prompt.md'),
    ].find((p) => existsSync(p));

    if (!promptPath) {
      throw new Error('translation-prompt.md not found in expected locations');
    }

    this.promptTemplate = readFileSync(promptPath, 'utf-8');
    this.logger.log(`Loaded translation prompt template from ${promptPath}`);
  }

  async translateBatch(
    projectId: string,
    pageIds: string[],
    modelOverride?: string,
  ): Promise<PageTranslationResult[]> {
    this.logger.log(`Executing visual page translation batch of ${pageIds.length} pages for project ${projectId}`);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        styleGuide: {
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
    const styleGuideContent = project.styleGuide.currentVersion?.content || 'Standard theological formal register.';
    const styleGuideName = project.styleGuide?.name || 'Project Style Guide';

    const pages = await this.prisma.page.findMany({
      where: { id: { in: pageIds } },
      orderBy: { pageNumber: 'asc' },
    });

    if (pages.length === 0) {
      this.logger.warn(`No pages found in translation batch pageIds: ${pageIds.join(', ')}`);
      return [];
    }

    const hasContextPage = pages.length > 3;
    const targetPages = hasContextPage ? pages.slice(0, 3) : pages;
    const contextPage = hasContextPage ? pages[3] : null;

    const results: PageTranslationResult[] = [];

    for (let i = 0; i < targetPages.length; i++) {
      const page = targetPages[i];
      this.logger.log(`Translating target page ${page.pageNumber} (ID: ${page.id})`);

      const translationMetadata = (page.translationMetadata as any) || {};
      const borrowedTextFromPrev = translationMetadata.borrowedTextFromNextPage || null;

      const searchRefText = page.originalHtml || '';
      let tmBlock = 'No past approved translations found for this page.';
      if (searchRefText.trim()) {
        const matches = await this.memoryService.retrieve(
          searchRefText.slice(0, 200),
          project.styleGuideId,
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

      let pageImageBase64 = '';
      const objectKey = `projects/${project.id}/pages/${page.pageNumber}.png`;
      try {
        const buffer = await this.minio.downloadFile(objectKey);
        if (buffer.toString('utf-8').startsWith('MOCK_')) {
          throw new Error('Mock placeholder image detected. Falling back to text prompt.');
        }
        pageImageBase64 = buffer.toString('base64');
      } catch (err) {
        this.logger.warn(`Direct visual image load failed for Page ${page.pageNumber}: ${(err as Error).message}. Using transparent fallback PNG.`);
        pageImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      }

      const pageDescriptions = targetPages.map((p) => `Page ${p.pageNumber}`).join(', ');
      const batchSize = targetPages.length;

      let stitchInstruction = '';
      if (borrowedTextFromPrev) {
        stitchInstruction = `The previous batch ended with an incomplete fragment: "${borrowedTextFromPrev}". PREPEND this fragment to the first body segment of Page ${page.pageNumber} so the sentence is complete. REMOVE the original fragment from wherever it was stored.`;
      }

      const nextPageInBatch = i + 1 < targetPages.length ? targetPages[i + 1] : null;
      const stitchInstructionCaseB = nextPageInBatch
        ? `When a sentence bleeds from Page ${page.pageNumber} to Page ${nextPageInBatch.pageNumber}: REMOVE the incomplete segment from Page ${page.pageNumber} and PREPEND its text to the first body segment of Page ${nextPageInBatch.pageNumber} to form the complete sentence.`
        : `When a sentence bleeds from Page ${page.pageNumber} to the next page: REMOVE the incomplete segment from Page ${page.pageNumber} and flag it in 'borrowedTextFromNextPage'.`;

      const styleGuideDescription = project.styleGuide?.description || '';

      const systemPrompt = this.promptTemplate
        .replace(/\{\{sourceLang\}\}/g, sourceLang)
        .replace(/\{\{targetLang\}\}/g, targetLang)
        .replace(/\{\{styleGuideName\}\}/g, styleGuideName)
        .replace(/\{\{#if styleGuideDescription\}\}([\s\S]*?)\{\{\/if\}\}/g, styleGuideDescription ? '$1' : '')
        .replace(/\{\{styleGuideContent\}\}/g, styleGuideContent)
        .replace(/\{\{pageCount\}\}/g, String(batchSize))
        .replace(/\{\{batchSizeMinusOne\}\}/g, String(batchSize - 1))
        .replace(/\{\{pageDescriptions\}\}/g, pageDescriptions)
        .replace(/\{\{stitchInstruction\}\}/g, stitchInstruction)
        .replace(/\{\{stitchInstructionCaseB\}\}/g, stitchInstructionCaseB);

      const userPrompt = `Please transcribe and translate the scanned page images provided, following the workflow in the system prompt above.`;

      const translation = await this.gemini.translatePageVisual(pageImageBase64, `${systemPrompt}\n\n${userPrompt}`, modelOverride);

      results.push({
        pageId: page.id,
        originalHtml: translation.originalHtml,
        translatedHtml: translation.translatedHtml,
        borrowedText: translation.boundaryMetadata?.borrowedTextFromNextPage,
        isNewChapter: translation.isNewChapter,
        chapterNumber: translation.chapterNumber,
        incompleteSentenceAtEnd: translation.incompleteSentenceAtEnd,
        modelUsed: translation.modelUsed,
      });

      if (translation.boundaryMetadata?.borrowedTextFromNextPage && i + 1 < pages.length) {
        const nextPage = pages[i + 1];
        const nextMeta = (nextPage.translationMetadata as any) || {};
        nextMeta.borrowedTextFromNextPage = translation.boundaryMetadata.borrowedTextFromNextPage;

        await this.prisma.page.update({
          where: { id: nextPage.id },
          data: { translationMetadata: nextMeta },
        });
        nextPage.translationMetadata = nextMeta;
      }
    }

    return results;
  }
}