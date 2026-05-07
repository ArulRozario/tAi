import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TranslationAgent } from './translation.agent';
import { ReviewAgent } from './review.agent';
import { ExtractionService } from './extraction.service';
import { PageStatus, Priority, JobType, JobStatus, ErrorSeverity } from '@prisma/client';

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
   * Run PROCESS_DOCUMENT job
   */
  async runProcessDocument(jobId: string): Promise<void> {
    try {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.RUNNING, startedAt: new Date() },
      });

      await this.extractionService.processDocument(jobId);

      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.DONE, completedAt: new Date() },
      });
    } catch (err) {
      this.logger.error(`PROCESS_DOCUMENT Job ${jobId} failed: ${(err as Error).message}`);
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.FAILED, errorMessage: (err as Error).message, completedAt: new Date() },
      });
    }
  }

  /**
   * Run EXTRACT_PAGE job
   */
  async runExtractPage(jobId: string): Promise<void> {
    try {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.RUNNING, startedAt: new Date() },
      });

      await this.extractionService.extractPage(jobId);

      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.DONE, completedAt: new Date() },
      });
    } catch (err) {
      this.logger.error(`EXTRACT_PAGE Job ${jobId} failed: ${(err as Error).message}`);
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.FAILED, errorMessage: (err as Error).message, completedAt: new Date() },
      });
    }
  }

  /**
   * Run DETECT_CHAPTERS job
   */
  async runDetectChapters(jobId: string): Promise<void> {
    try {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.RUNNING, startedAt: new Date() },
      });

      await this.extractionService.detectChapters(jobId);

      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.DONE, completedAt: new Date() },
      });
    } catch (err) {
      this.logger.error(`DETECT_CHAPTERS Job ${jobId} failed: ${(err as Error).message}`);
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.FAILED, errorMessage: (err as Error).message, completedAt: new Date() },
      });
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

    const payload = job.payload as { projectId: string; pageIds: string[] };
    const { projectId, pageIds } = payload;

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

      // 1. Translate batch of pages visually (Gemini 1.5 Flash sliding context)
      const results = await this.translationAgent.translateBatch(projectId, pageIds);

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
            ...(assignedChapterId ? { chapterId: assignedChapterId } : {}),
          },
        });

        // 3. Enqueue individual REVIEW_PAGE jobs
        await this.prisma.job.create({
          data: {
            type: JobType.REVIEW_PAGE,
            status: JobStatus.QUEUED,
            projectId,
            pageId: item.pageId,
            payload: { pageId: item.pageId },
          },
        });
      }

      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.DONE, completedAt: new Date() },
      });
    } catch (err) {
      this.logger.warn(`Translation batch ${jobId} failed: ${(err as Error).message}. Applying retry strategy...`);

      // Batch Split Strategy: If batch contains more than 1 page, split it in half and spawn child jobs
      if (pageIds.length > 1) {
        const mid = Math.floor(pageIds.length / 2);
        const firstHalf = pageIds.slice(0, mid);
        const secondHalf = pageIds.slice(mid);

        this.logger.log(`Splitting batch ${jobId} of size ${pageIds.length} into two child batches: ${firstHalf.length} and ${secondHalf.length} pages.`);

        await this.prisma.job.create({
          data: {
            type: JobType.TRANSLATE_BATCH,
            status: JobStatus.QUEUED,
            projectId,
            payload: { projectId, pageIds: firstHalf },
            parentJobId: jobId,
          },
        });

        await this.prisma.job.create({
          data: {
            type: JobType.TRANSLATE_BATCH,
            status: JobStatus.QUEUED,
            projectId,
            payload: { projectId, pageIds: secondHalf },
            parentJobId: jobId,
          },
        });

        await this.prisma.job.update({
          where: { id: jobId },
          data: { status: JobStatus.CANCELLED, errorMessage: `Split into halved child batches due to error: ${(err as Error).message}`, completedAt: new Date() },
        });
      } else {
        // Only 1 page, standard retry count capping
        const nextRetry = job.retryCount + 1;
        if (nextRetry >= 3) {
          this.logger.error(`Max translation retries exceeded for page batch ${jobId}`);
          await this.prisma.job.update({
            where: { id: jobId },
            data: { status: JobStatus.FAILED, errorMessage: (err as Error).message, completedAt: new Date() },
          });

          await this.prisma.page.updateMany({
            where: { id: { in: pageIds } },
            data: { status: PageStatus.ERROR, errorMessage: (err as Error).message },
          });
        } else {
          // Re-queue
          await this.prisma.job.update({
            where: { id: jobId },
            data: { status: JobStatus.QUEUED, retryCount: nextRetry, errorMessage: (err as Error).message },
          });
        }
      }
    }
  }

  /**
   * Run REVIEW_PAGE job
   */
  async runReviewPage(jobId: string): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { page: true },
    });

    if (!job || !job.page) {
      return;
    }

    const { page } = job;

    try {
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.RUNNING, startedAt: new Date() },
      });

      await this.prisma.page.update({
        where: { id: page.id },
        data: { status: PageStatus.REVIEWING },
      });

      // 1. Run visual/linguistic quality verification
      const originalHtml = page.originalHtml || '';
      const translatedHtml = page.translatedHtml || '';
      
      const results = await this.reviewAgent.reviewPage(
        page.projectId,
        page.id,
        originalHtml,
        translatedHtml,
      );

      // 2. Clear previous errors on this page and insert new ones
      await this.prisma.error.deleteMany({
        where: { pageId: page.id },
      });

      for (const err of results) {
        await this.prisma.error.create({
          data: {
            pageId: page.id,
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

      // 3. Calculate page quality score & worst severity priority
      const errorsOnPage = await this.prisma.error.findMany({
        where: { pageId: page.id },
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

      // Spec formula: max(0, round(100 − (critical×5 + high×2 + medium×1 + low×0.5)))
      const pageQuality = Math.max(0, Math.round(100 - (criticalCount * 5 + highCount * 2 + medCount * 1 + lowCount * 0.5)));

      // Map worst severity to page Priority
      let priority: Priority = Priority.MEDIUM;
      if (worstSeverity === ErrorSeverity.CRITICAL) priority = Priority.CRITICAL;
      else if (worstSeverity === ErrorSeverity.HIGH) priority = Priority.HIGH;
      else if (worstSeverity === ErrorSeverity.MEDIUM) priority = Priority.MEDIUM;
      else if (worstSeverity === ErrorSeverity.LOW) priority = Priority.LOW;

      // 4. Round-robin auto-assign reviewer with fewest current assignments
      const reviewers = await this.prisma.user.findMany({
        where: { role: 'REVIEWER' },
      });

      let assignedReviewerId: string | null = null;

      if (reviewers.length > 0) {
        let bestReviewerId = reviewers[0].id;
        let lowestCount = Infinity;

        for (const rev of reviewers) {
          const count = await this.prisma.pageReviewer.count({
            where: {
              userId: rev.id,
              page: { status: PageStatus.HUMAN_REVIEW },
            },
          });

          if (count < lowestCount) {
            lowestCount = count;
            bestReviewerId = rev.id;
          }
        }

        assignedReviewerId = bestReviewerId;

        // Upsert assignment record
        await this.prisma.pageReviewer.upsert({
          where: {
            pageId_userId: {
              pageId: page.id,
              userId: assignedReviewerId,
            },
          },
          create: {
            pageId: page.id,
            userId: assignedReviewerId,
            isPrimary: true,
          },
          update: {
            isPrimary: true,
          },
        });
      }

      // 5. Transition page to HUMAN_REVIEW
      await this.prisma.page.update({
        where: { id: page.id },
        data: {
          status: PageStatus.HUMAN_REVIEW,
          quality: pageQuality,
          priority,
          assignedAt: new Date(),
          lastAiRunAt: new Date(),
        },
      });

      // 6. Check and aggregate overall project status completion
      // PROCESSING → REVIEW when all pages are HUMAN_REVIEW or APPROVED (per spec)
      // REVIEW → COMPLETED when all pages are APPROVED
      const totalPageCount = await this.prisma.page.count({ where: { projectId: page.projectId } });
      const approvedCount = await this.prisma.page.count({ where: { projectId: page.projectId, status: PageStatus.APPROVED } });
      const humanReviewCount = await this.prisma.page.count({ where: { projectId: page.projectId, status: PageStatus.HUMAN_REVIEW } });

      if (approvedCount === totalPageCount) {
        await this.prisma.project.update({
          where: { id: page.projectId },
          data: { status: 'COMPLETED' },
        });
      } else if (approvedCount + humanReviewCount === totalPageCount) {
        await this.prisma.project.update({
          where: { id: page.projectId },
          data: { status: 'REVIEW' },
        });
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

      await this.prisma.page.update({
        where: { id: page.id },
        data: { status: PageStatus.ERROR, errorMessage: (err as Error).message },
      });
    }
  }
}