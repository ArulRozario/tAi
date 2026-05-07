import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentOrchestrator } from '../agents/agent.orchestrator';
import { MemoryService } from '../agents/memory.service';
import { ExportService } from '../export/export.service';
import { Job, JobStatus, JobType } from '@prisma/client';

@Injectable()
export class JobWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobWorker.name);
  private pollTimeout?: NodeJS.Timeout;
  private shuttingDown = false;
  private readonly activeJobs = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: AgentOrchestrator,
    private readonly memoryService: MemoryService,
    private readonly exportService: ExportService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing JobWorker, starting startup crash recovery...');
    await this.recoverRunningJobs();
    this.startPolling();
  }

  async onModuleDestroy() {
    this.shuttingDown = true;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
    }

    this.logger.log('Gracefully shutting down JobWorker...');

    // Wait for active in-flight jobs to finish processing
    while (this.activeJobs.size > 0) {
      this.logger.log(`Waiting for ${this.activeJobs.size} in-flight jobs to complete before exit...`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    this.logger.log('All in-flight jobs completed. JobWorker shutdown clean.');
  }

  /**
   * Scans and auto-recovers jobs left in RUNNING status during a previous server crash.
   */
  private async recoverRunningJobs() {
    try {
      const runningJobs = await this.prisma.job.findMany({
        where: { status: JobStatus.RUNNING },
      });

      for (const job of runningJobs) {
        this.logger.log(`Crash recovery: Found stuck RUNNING job ${job.id} of type ${job.type}`);
        
        const newRetryCount = job.retryCount + 1;
        if (newRetryCount < 3) {
          await this.prisma.job.update({
            where: { id: job.id },
            data: {
              status: JobStatus.QUEUED,
              retryCount: newRetryCount,
              errorMessage: 'Job worker crashed or restarted during execution. Automatic re-queue triggered.',
            },
          });
          this.logger.log(`Crash recovery: Enqueued retry ${newRetryCount} for job ${job.id}`);
        } else {
          await this.prisma.job.update({
            where: { id: job.id },
            data: {
              status: JobStatus.FAILED,
              retryCount: newRetryCount,
              errorMessage: 'Job worker crashed or restarted during execution. Permanently failed after 3 attempts.',
              completedAt: new Date(),
            },
          });
          this.logger.warn(`Crash recovery: Job ${job.id} permanently marked FAILED (retry cap reached)`);
        }
      }
    } catch (err: any) {
      this.logger.error('Error during stuck running jobs recovery:', err);
    }
  }

  /**
   * Starts the polling timer.
   */
  private startPolling() {
    if (this.shuttingDown) return;
    this.pollTimeout = setTimeout(async () => {
      await this.pollAndExecute();
      this.startPolling();
    }, 2000);
  }

  /**
   * Performs an atomic lock and fetch transaction for the oldest queued job.
   */
  private async pollAndExecute() {
    let lockedJob: Job | null = null;

    try {
      // 1. Transaction to select oldest QUEUED job with SELECT FOR UPDATE SKIP LOCKED
      lockedJob = await this.prisma.$transaction(async (tx) => {
        const result = await tx.$queryRaw<any[]>`
          SELECT id FROM "Job"
          WHERE "status" = 'QUEUED'
          ORDER BY "createdAt" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED;
        `;

        if (result.length === 0) {
          return null;
        }

        const targetId = result[0].id;
        return tx.job.update({
          where: { id: targetId },
          data: {
            status: JobStatus.RUNNING,
            startedAt: new Date(),
          },
        });
      });
    } catch (err: any) {
      this.logger.error('Failed to query or lock queued job from database:', err);
      return;
    }

    if (!lockedJob) {
      return;
    }

    // 2. Execute locked job
    this.activeJobs.add(lockedJob.id);
    this.logger.log(`Started executing job ${lockedJob.id} of type ${lockedJob.type}`);

    try {
      await this.executeJob(lockedJob);

      // 3. Post-execution cancellation check
      const finalState = await this.prisma.job.findUnique({
        where: { id: lockedJob.id },
      });

      if (finalState?.status === JobStatus.CANCELLED) {
        this.logger.warn(`Job ${lockedJob.id} was cancelled gracefully mid-execution. Output discarded.`);
        return;
      }

      // Mark completed successfully
      await this.prisma.job.update({
        where: { id: lockedJob.id },
        data: {
          status: JobStatus.DONE,
          progress: 100,
          completedAt: new Date(),
        },
      });
      this.logger.log(`Job ${lockedJob.id} successfully completed (status: DONE).`);
    } catch (err: any) {
      this.logger.error(`Execution failed for job ${lockedJob.id}:`, err);

      try {
        // Increment retry or fail permanently
        const currentJob = await this.prisma.job.findUnique({
          where: { id: lockedJob.id },
        });

        if (currentJob && currentJob.status !== JobStatus.CANCELLED) {
          const newRetryCount = currentJob.retryCount + 1;
          if (newRetryCount < 3) {
            await this.prisma.job.update({
              where: { id: lockedJob.id },
              data: {
                status: JobStatus.QUEUED,
                retryCount: newRetryCount,
                errorMessage: String(err?.message || err),
              },
            });
            this.logger.log(`Re-queued job ${lockedJob.id} for retry attempt ${newRetryCount}`);
          } else {
            await this.prisma.job.update({
              where: { id: lockedJob.id },
              data: {
                status: JobStatus.FAILED,
                retryCount: newRetryCount,
                errorMessage: String(err?.message || err),
                completedAt: new Date(),
              },
            });
            this.logger.error(`Job ${lockedJob.id} permanently failed (exceeded retries).`);
          }
        }
      } catch (nestedErr: any) {
        this.logger.error(`Failed to update failure state for job ${lockedJob.id}:`, nestedErr);
      }
    } finally {
      this.activeJobs.delete(lockedJob.id);
    }
  }

  /**
   * Dispatches the locked job to its respective handler.
   */
  private async executeJob(job: Job) {
    switch (job.type) {
      case JobType.PROCESS_DOCUMENT:
        await this.orchestrator.runProcessDocument(job.id);
        break;

      case JobType.EXTRACT_PAGE:
        await this.orchestrator.runExtractPage(job.id);
        break;

      case JobType.DETECT_CHAPTERS:
        await this.orchestrator.runDetectChapters(job.id);
        break;

      case JobType.TRANSLATE_BATCH:
        await this.orchestrator.runTranslateBatch(job.id);
        break;

      case JobType.REVIEW_PAGE:
        await this.orchestrator.runReviewPage(job.id);
        break;

      case JobType.INDEX_MEMORY:
        if (!job.pageId) {
          throw new Error('INDEX_MEMORY job is missing required pageId field.');
        }
        await this.memoryService.indexPage(job.pageId);
        break;

      case JobType.EXPORT_PROJECT: {
        const { format, scope } = job.payload as { format: string; scope: string };
        await this.exportService.runExportProject(job.id, job.projectId!, format, scope);
        break;
      }

      case JobType.EXPORT_PAGE_REPORT:
        await this.exportService.runExportPageReport(job.id, job.pageId!);
        break;

      case JobType.EXPORT_ADMIN_REPORT: {
        const { projectIds, format } = job.payload as { projectIds: string[]; format: string };
        await this.exportService.runExportAdminReport(job.id, projectIds, format);
        break;
      }

      default:
        throw new Error(`Unsupported background job type: ${job.type}`);
    }
  }
}
