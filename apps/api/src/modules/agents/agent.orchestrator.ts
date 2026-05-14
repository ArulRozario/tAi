import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TranslationAgent } from './translation.agent';
import { ReviewAgent } from './review.agent';
import { ExtractionService } from './extraction.service';
import { PageStatus, Priority, JobStatus, JobType, ProjectStatus, ErrorSeverity, ErrorStatus } from '@prisma/client';

@Injectable()
export class AgentOrchestrator {
  private readonly logger = new Logger(AgentOrchestrator.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly extractionService: ExtractionService,
    private readonly translationAgent: TranslationAgent,
    private readonly reviewAgent: ReviewAgent,
  ) {}

  /**
   * Run SPLIT_DOCUMENT job
   */
  async runSplitDocument(jobId: string): Promise<void> {
    try {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.RUNNING, startedAt: new Date() },
      });

      await this.extractionService.splitDocument(jobId);

      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.DONE, completedAt: new Date() },
      });
    } catch (err) {
      this.logger.error(`SPLIT_DOCUMENT Job ${jobId} failed: ${(err as Error).message}`);
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.FAILED, errorMessage: (err as Error).message, completedAt: new Date() },
      });
    }
  }

  /**
   * Run RENDER_PAGE job
   */
  async runRenderPage(jobId: string): Promise<void> {
    try {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.RUNNING, startedAt: new Date() },
      });

      await this.extractionService.renderPage(jobId);

      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.DONE, completedAt: new Date() },
      });
    } catch (err) {
      const errMsg = (err as Error).message;
      this.logger.error(`RENDER_PAGE Job ${jobId} failed: ${errMsg}`);
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.FAILED, errorMessage: errMsg, completedAt: new Date() },
      });
      // Mark the page so the UI can show a render-specific error
      const job = await this.prisma.job.findUnique({ where: { id: jobId }, select: { pageId: true } });
      if (job?.pageId) {
        await this.prisma.page.update({
          where: { id: job.pageId },
          data: { status: PageStatus.RENDER_ERROR, errorMessage: errMsg },
        });
      }
    }
  }

  /**
   * Run TRANSLATE_BATCH job with error split retry strategy
   */
  async runTranslateBatch(jobId: string): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return;
    }

    const payload = job.payload as { projectId: string; pageIds: string[]; modelOverride?: string };
    const { projectId, pageIds, modelOverride } = payload;

    try {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.RUNNING, startedAt: new Date() },
      });

      // Update pages status to TRANSLATING
      await this.prisma.page.updateMany({
        where: { id: { in: pageIds } },
        data: { status: PageStatus.TRANSLATING },
      });

      // 1. Translate batch of pages visually (Gemini with fallback)
      const results = await this.translationAgent.translateBatch(projectId, pageIds, modelOverride);

      // 2. Save translated outputs and create/update Chapters dynamically!
      for (const item of results) {
        let assignedChapterId: string | null = null;
        
        if (item.isNewChapter && item.chapterNumber) {
          // Idempotent Chapter fetching or creation
          let chapter = await this.prisma.chapter.findFirst({
            where: { projectId, number: item.chapterNumber },
          });
          if (!chapter) {
            chapter = await this.prisma.chapter.create({
              data: {
                projectId,
                number: item.chapterNumber,
                title: `Chapter ${item.chapterNumber}`,
              },
            });
          }
          assignedChapterId = chapter.id;
        }

        await this.prisma.page.update({
          where: { id: item.pageId },
          data: {
            originalHtml: item.originalHtml,
            translatedHtml: item.translatedHtml,
            status: PageStatus.TRANSLATED,
            translationModel: item.modelUsed,
            ...(assignedChapterId ? { chapterId: assignedChapterId } : {}),
          },
        });

        // Note: REVIEW_PAGE is now triggered manually via POST /pages/:id/review
        // or POST /projects/:id/review instead of automatically after translation
      }

      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.DONE, completedAt: new Date() },
      });

      // If no more TRANSLATE_BATCH jobs are queued/running for this project, mark it translated.
      const remaining = await this.prisma.job.count({
        where: {
          projectId,
          type: JobType.TRANSLATE_BATCH,
          status: { in: [JobStatus.QUEUED, JobStatus.RUNNING] },
        },
      });
      if (remaining === 0) {
        await this.prisma.project.update({
          where: { id: projectId },
          data: { status: ProjectStatus.REVIEW },
        });
        this.logger.log(`Project ${projectId}: all translation batches done → REVIEW`);
      }
    } catch (err) {
      const errMsg = (err as Error).message || String(err);
      this.logger.warn(`Translation batch ${jobId} failed (attempt ${job.retryCount + 1}/3): ${errMsg}`);

      const nextRetry = job.retryCount + 1;
      if (nextRetry >= 3) {
        this.logger.error(`Max retries exceeded for batch ${jobId} — marking pages ERROR.`);
        await this.prisma.job.update({
          where: { id: jobId },
          data: { status: JobStatus.FAILED, errorMessage: errMsg, completedAt: new Date() },
        });
        await this.prisma.page.updateMany({
          where: { id: { in: pageIds } },
          data: { status: PageStatus.TRANSLATION_ERROR, errorMessage: errMsg },
        });
      } else {
        await this.prisma.job.update({
          where: { id: jobId },
          data: { status: JobStatus.QUEUED, retryCount: nextRetry, errorMessage: errMsg },
        });
      }
    }
  }

  /**
   * Run REVIEW_PAGE job.
   * Supports both single page review and batch review from POST /projects/:id/review.
   */
  async runReviewPage(jobId: string): Promise<void> {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });

    if (!job) return;

    const payload = job.payload as Record<string, any>;
    const isBatchReview = payload?.isBatchReview === true;
    const pageIds: string[] = payload?.pageIds || (job.pageId ? [job.pageId] : []);
    const modelOverride: string | undefined = payload?.modelOverride;

    if (pageIds.length === 0) {
      this.logger.error(`REVIEW_PAGE Job ${jobId} has no pages to review`);
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.FAILED, errorMessage: 'No pages to review', completedAt: new Date() },
      });
      return;
    }

    try {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.RUNNING, startedAt: new Date() },
      });

      for (const pageId of pageIds) {
        const page = await this.prisma.page.findUnique({
          where: { id: pageId },
          include: { project: { select: { id: true, name: true } } },
        });

        if (!page || !page.translatedHtml) {
          this.logger.warn(`Skipping review for page ${pageId}: not found or not translated`);
          continue;
        }

        await this.prisma.page.update({
          where: { id: pageId },
          data: { status: PageStatus.REVIEWING },
        });

        const { errors: results, modelUsed } = await this.reviewAgent.reviewPage(
          page.projectId,
          page.id,
          page.originalHtml || '',
          page.translatedHtml,
          modelOverride,
        );

        await this.prisma.error.deleteMany({
          where: { pageId: page.id, status: ErrorStatus.OPEN },
        });

        for (const err of results) {
          await this.prisma.error.create({
            data: {
              pageId: page.id,
              segmentId: err.segmentId || null,
              severity: err.severity,
              category: err.category,
              location: err.location,
              currentText: err.currentText,
              suggestedText: err.suggestedText,
              issueDescription: err.issueDescription,
              reference: err.reference,
              aiNote: err.aiNote,
            },
          });
        }

        const errorsOnPage = await this.prisma.error.findMany({
          where: { pageId: page.id, status: ErrorStatus.OPEN },
        });

        let criticalCount = 0, highCount = 0, medCount = 0, lowCount = 0;
        let worstSeverity: ErrorSeverity | null = null;

        for (const err of errorsOnPage) {
          if (err.severity === ErrorSeverity.CRITICAL) {
            criticalCount++;
            worstSeverity = ErrorSeverity.CRITICAL;
          } else if (err.severity === ErrorSeverity.HIGH) {
            highCount++;
            if (worstSeverity !== ErrorSeverity.CRITICAL) worstSeverity = ErrorSeverity.HIGH;
          } else if (err.severity === ErrorSeverity.MEDIUM) {
            medCount++;
            if (worstSeverity !== ErrorSeverity.CRITICAL && worstSeverity !== ErrorSeverity.HIGH) worstSeverity = ErrorSeverity.MEDIUM;
          } else if (err.severity === ErrorSeverity.LOW) {
            lowCount++;
            if (!worstSeverity) worstSeverity = ErrorSeverity.LOW;
          }
        }

        const pageQuality = Math.max(0, Math.round(100 - (criticalCount * 5 + highCount * 2 + medCount * 1 + lowCount * 0.5)));

        let priority: Priority = Priority.MEDIUM;
        if (worstSeverity === ErrorSeverity.CRITICAL) priority = Priority.CRITICAL;
        else if (worstSeverity === ErrorSeverity.HIGH) priority = Priority.HIGH;
        else if (worstSeverity === ErrorSeverity.MEDIUM) priority = Priority.MEDIUM;
        else if (worstSeverity === ErrorSeverity.LOW) priority = Priority.LOW;

        const reviewers = await this.prisma.user.findMany({
          where: { role: 'REVIEWER', isActive: true },
        });

        if (reviewers.length > 0) {
          let bestReviewerId = reviewers[0].id;
          let lowestCount = Infinity;

          for (const rev of reviewers) {
            const count = await this.prisma.pageReviewer.count({
              where: { userId: rev.id, page: { status: PageStatus.HUMAN_REVIEW } },
            });
            if (count < lowestCount) {
              lowestCount = count;
              bestReviewerId = rev.id;
            }
          }

          await this.prisma.pageReviewer.upsert({
            where: { pageId_userId: { pageId: page.id, userId: bestReviewerId } },
            create: { pageId: page.id, userId: bestReviewerId, isPrimary: true },
            update: { isPrimary: true },
          });
        }

        await this.prisma.page.update({
          where: { id: page.id },
          data: {
            status: PageStatus.HUMAN_REVIEW,
            quality: pageQuality,
            priority,
            assignedAt: new Date(),
            lastAiRunAt: new Date(),
            reviewModel: modelUsed,
          },
        });

        this.logger.log(`Reviewed page ${pageId}: ${results.length} errors, quality ${pageQuality}%`);
      }

      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.DONE, completedAt: new Date() },
      });
    } catch (err) {
      this.logger.error(`REVIEW_PAGE Job ${jobId} failed: ${(err as Error).message}`);
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.FAILED, errorMessage: (err as Error).message, completedAt: new Date() },
      });
    }
  }
}