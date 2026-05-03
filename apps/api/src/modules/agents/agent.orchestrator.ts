import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TranslationAgent } from './translation.agent';
import { ReviewAgent } from './review.agent';
import { PageStatus } from '@prisma/client';

export interface ProcessResult {
  success: boolean;
  message: string;
  pageId: string;
}

@Injectable()
export class AgentOrchestrator {
  private readonly logger = new Logger(AgentOrchestrator.name);

  constructor(
    private prisma: PrismaService,
    private translationAgent: TranslationAgent,
    private reviewAgent: ReviewAgent,
  ) {}

  async processPage(pageId: string): Promise<ProcessResult> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
    });

    if (!page) {
      return { success: false, message: 'Page not found', pageId };
    }

    try {
      this.logger.log(`Processing page ${pageId} - Status: ${page.status}`);

      // Step 1: Extract (skip for now - would use PaddleOCR)
      if (page.status === PageStatus.PENDING) {
        this.logger.log('Skipping extraction - would use PaddleOCR');
      }

      // Step 2: Translate
      if (page.status === PageStatus.PENDING || page.status === PageStatus.EXTRACTED) {
        await this.translationAgent.translatePage(pageId);
      }

      // Step 3: Review (AI quality check)
      if (page.status === PageStatus.TRANSLATED) {
        await this.reviewAgent.reviewPage(pageId);
      }

      // Step 4: Route to human (already set by ReviewAgent)
      this.logger.log(`Page ${pageId} processed - ready for human review`);

      return { success: true, message: 'Processed successfully', pageId };
    } catch (error) {
      this.logger.error(`Error processing page ${pageId}: ${(error as Error).message}`);
      return { success: false, message: (error as Error).message, pageId };
    }
  }

  async processProject(projectId: string): Promise<ProcessResult[]> {
    const pages = await this.prisma.page.findMany({
      where: { projectId },
      orderBy: { pageNumber: 'asc' },
    });

    const results: ProcessResult[] = [];

    for (const page of pages) {
      const result = await this.processPage(page.id);
      results.push(result);

      // Small delay between pages to avoid overwhelming Ollama
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  async retryPage(pageId: string): Promise<ProcessResult> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
    });

    if (!page) {
      return { success: false, message: 'Page not found', pageId };
    }

    if (page.retryCount >= page.maxRetries) {
      return { success: false, message: 'Max retries exceeded', pageId };
    }

    // Increment retry count and reset status
    await this.prisma.page.update({
      where: { id: pageId },
      data: {
        retryCount: { increment: 1 },
        status: PageStatus.PENDING,
      },
    });

    return this.processPage(pageId);
  }
}