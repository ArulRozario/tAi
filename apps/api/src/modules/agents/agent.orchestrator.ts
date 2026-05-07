import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TranslationAgent } from './translation.agent';
import { ReviewAgent } from './review.agent';
import { ExtractionService } from './extraction.service';
import { PageStatus, Priority, JobType, JobStatus, SentenceStatus, ErrorSeverity } from '@prisma/client';

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

      // 1. Gather sentences for this batch
      const sentences = await this.prisma.sentence.findMany({
        where: { pageId: { in: pageIds } },
        orderBy: { sentenceNumber: 'asc' },
      });

      if (sentences.length === 0) {
        this.logger.warn(`No sentences found to translate in batch ${jobId}`);
      } else {
        const inputList = sentences.map((s) => ({ id: s.id, text: s.originalText }));

        // 2. Translate sentences
        const results = await this.translationAgent.translateBatch(projectId, inputList, pageIds);

        // 3. Save translations to DB
        for (const item of results) {
          await this.prisma.sentence.update({
            where: { id: item.id },
            data: {
              translatedText: item.translatedText,
              aiTranslatedText: item.translatedText,
              confidence: item.confidence,
              status: SentenceStatus.TRANSLATED,
            },
          });
        }
      }

      // 4. Mark pages as TRANSLATED & enqueue individual REVIEW_PAGE jobs
      for (const pageId of pageIds) {
        await this.prisma.page.update({
          where: { id: pageId },
          data: { status: PageStatus.TRANSLATED },
        });

        await this.prisma.job.create({
          data: {
            type: JobType.REVIEW_PAGE,
            status: JobStatus.QUEUED,
            projectId,
            pageId,
            payload: { pageId },
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

      // 1. Gather all unreviewed page sentences
      const sentences = await this.prisma.sentence.findMany({
        where: { pageId: page.id, status: { not: SentenceStatus.REVIEWED } },
        orderBy: { sentenceNumber: 'asc' },
      });

      if (sentences.length > 0) {
        const inputList = sentences.map((s) => ({
          id: s.id,
          source: s.originalText,
          translation: s.translatedText || '',
        }));

        // 2. Call ReviewAgent
        const results = await this.reviewAgent.reviewBatch(page.projectId, inputList);

        // 3. Process errors and update sentence metadata
        for (const item of results) {
          // Clear previous errors to avoid duplicates
          await this.prisma.error.deleteMany({
            where: { sentenceId: item.sentenceId },
          });

          // Insert new open errors
          for (const err of item.errors) {
            await this.prisma.error.create({
              data: {
                sentenceId: item.sentenceId,
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

          // Mark sentence as REVIEWED
          await this.prisma.sentence.update({
            where: { id: item.sentenceId },
            data: { status: SentenceStatus.REVIEWED },
          });
        }
      }

      // 4. Calculate page quality score & assign priorities
      const errorsOnPage = await this.prisma.error.findMany({
        where: { sentence: { pageId: page.id } },
      });

      let pageQuality = 100;
      let worstSeverity: ErrorSeverity | null = null;

      for (const err of errorsOnPage) {
        // Quality score penalty deduction calculations
        if (err.severity === ErrorSeverity.CRITICAL) {
          pageQuality -= 25;
          worstSeverity = ErrorSeverity.CRITICAL;
        } else if (err.severity === ErrorSeverity.HIGH) {
          pageQuality -= 15;
          if (worstSeverity !== ErrorSeverity.CRITICAL) worstSeverity = ErrorSeverity.HIGH;
        } else if (err.severity === ErrorSeverity.MEDIUM) {
          pageQuality -= 10;
          if (worstSeverity !== ErrorSeverity.CRITICAL && worstSeverity !== ErrorSeverity.HIGH) worstSeverity = ErrorSeverity.MEDIUM;
        } else if (err.severity === ErrorSeverity.LOW) {
          pageQuality -= 5;
          if (!worstSeverity) worstSeverity = ErrorSeverity.LOW;
        }
      }

      // Constrain quality score within [0, 100] bounds
      pageQuality = Math.max(0, pageQuality);

      // Map worst severity to page Priority
      let priority: Priority = Priority.MEDIUM;
      if (worstSeverity === ErrorSeverity.CRITICAL) priority = Priority.CRITICAL;
      else if (worstSeverity === ErrorSeverity.HIGH) priority = Priority.HIGH;
      else if (worstSeverity === ErrorSeverity.MEDIUM) priority = Priority.MEDIUM;
      else if (worstSeverity === ErrorSeverity.LOW) priority = Priority.LOW;

      // 5. Round-robin auto-assign reviewer with fewest current assignments
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

      // 6. Transition page to HUMAN_REVIEW
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

      // 7. Check and aggregate overall project status completion
      const totalPageCount = await this.prisma.page.count({ where: { projectId: page.projectId } });
      const approvedCount = await this.prisma.page.count({ where: { projectId: page.projectId, status: PageStatus.APPROVED } });
      const reviewPendingCount = await this.prisma.page.count({ where: { projectId: page.projectId, status: { in: [PageStatus.HUMAN_REVIEW, PageStatus.REJECTED] } } });

      if (approvedCount === totalPageCount) {
        await this.prisma.project.update({
          where: { id: page.projectId },
          data: { status: 'COMPLETED' },
        });
      } else if (approvedCount + reviewPendingCount === totalPageCount) {
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