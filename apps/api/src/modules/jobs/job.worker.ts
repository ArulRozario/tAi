import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentOrchestrator } from '../agents/agent.orchestrator';
import { MemoryService } from '../agents/memory.service';
import { ExportService } from '../export/export.service';
import { Job, JobStatus, JobType } from '@prisma/client';

// Sentinel key used for jobs that have no projectId (e.g. admin exports)
const GLOBAL_QUEUE_KEY = '__global__';

@Injectable()
export class JobWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobWorker.name);
  private discoverTimeout?: NodeJS.Timeout;
  private shuttingDown = false;

  /**
   * Tracks one in-flight promise per project (or GLOBAL_QUEUE_KEY for
   * jobs without a projectId). Each promise runs its project's jobs
   * serially and resolves when the project queue drains.
   */
  private readonly projectWorkers = new Map<string, Promise<void>>();

  /** All job IDs currently being executed (across all project queues). */
  private readonly activeJobs = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: AgentOrchestrator,
    private readonly memoryService: MemoryService,
    private readonly exportService: ExportService,
  ) {}

  async onModuleInit() {
    this.logger.log('JobWorker initialising — running crash recovery…');
    await this.recoverRunningJobs();
    this.scheduleDiscovery();
  }

  async onModuleDestroy() {
    this.shuttingDown = true;
    if (this.discoverTimeout) clearTimeout(this.discoverTimeout);

    this.logger.log('JobWorker shutting down — waiting for in-flight jobs…');
    await Promise.all([...this.projectWorkers.values()]);
    this.logger.log('JobWorker shutdown complete.');
  }

  // ── Discovery loop ─────────────────────────────────────────────────────────

  private scheduleDiscovery() {
    if (this.shuttingDown) return;
    this.discoverTimeout = setTimeout(async () => {
      await this.discoverAndSpawn();
      this.scheduleDiscovery();
    }, 2000);
  }

  /**
   * Finds every distinct projectId (plus null) that has QUEUED jobs and
   * ensures exactly one serial worker coroutine is running for each.
   */
  private async discoverAndSpawn() {
    let rows: { projectId: string | null }[];
    try {
      rows = await this.prisma.job.findMany({
        where: { status: JobStatus.QUEUED },
        select: { projectId: true },
        distinct: ['projectId'],
      });
    } catch (err: any) {
      this.logger.error('Discovery query failed:', err);
      return;
    }

    for (const { projectId } of rows) {
      const key = projectId ?? GLOBAL_QUEUE_KEY;
      if (!this.projectWorkers.has(key)) {
        const worker = this.runProjectQueue(projectId).finally(() => {
          this.projectWorkers.delete(key);
        });
        this.projectWorkers.set(key, worker);
        this.logger.log(`Spawned worker for project queue: ${key}`);
      }
    }
  }

  // ── Per-project serial queue ───────────────────────────────────────────────

  private async runProjectQueue(projectId: string | null) {
    while (!this.shuttingDown) {
      const job = await this.claimNextJob(projectId);
      if (!job) break; // queue drained

      this.activeJobs.add(job.id);
      this.logger.log(`[${projectId ?? 'global'}] Running job ${job.id} (${job.type})`);

      try {
        await this.executeJob(job);

        // Only mark DONE if the executor left the job RUNNING.
        // Executors like runTranslateBatch manage their own terminal states
        // (CANCELLED for splits, FAILED for exhausted retries, QUEUED for retry).
        // Overwriting those would break retry logic and mask failures.
        const latest = await this.prisma.job.findUnique({ where: { id: job.id } });
        if (latest?.status === JobStatus.RUNNING) {
          await this.prisma.job.update({
            where: { id: job.id },
            data: { status: JobStatus.DONE, progress: 100, completedAt: new Date() },
          });
          this.logger.log(`Job ${job.id} completed (DONE).`);
        } else {
          this.logger.log(`Job ${job.id} status already set to ${latest?.status} by executor — not overwriting.`);
        }
      } catch (err: any) {
        await this.handleJobFailure(job, err);
      } finally {
        this.activeJobs.delete(job.id);
      }
    }
  }

  /**
   * Atomically claims the oldest QUEUED job for the given project using
   * SELECT FOR UPDATE SKIP LOCKED so concurrent workers never double-pick.
   */
  private async claimNextJob(projectId: string | null): Promise<Job | null> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const rows: { id: string }[] =
          projectId !== null
            ? await tx.$queryRaw`
                SELECT id FROM "Job"
                WHERE status = 'QUEUED' AND "projectId" = ${projectId}
                ORDER BY "createdAt" ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED`
            : await tx.$queryRaw`
                SELECT id FROM "Job"
                WHERE status = 'QUEUED' AND "projectId" IS NULL
                ORDER BY "createdAt" ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED`;

        if (!rows.length) return null;

        return tx.job.update({
          where: { id: rows[0].id },
          data: { status: JobStatus.RUNNING, startedAt: new Date() },
        });
      });
    } catch {
      return null;
    }
  }

  // ── Error handling & retry ─────────────────────────────────────────────────

  private async handleJobFailure(job: Job, err: any) {
    this.logger.error(`Job ${job.id} (${job.type}) failed: ${err?.message ?? err}`);
    try {
      const current = await this.prisma.job.findUnique({ where: { id: job.id } });
      if (!current || current.status === JobStatus.CANCELLED) return;

      const retries = current.retryCount + 1;
      if (retries < 3) {
        await this.prisma.job.update({
          where: { id: job.id },
          data: { status: JobStatus.QUEUED, retryCount: retries, errorMessage: String(err?.message ?? err) },
        });
        this.logger.log(`Re-queued job ${job.id} for retry ${retries}/3`);
      } else {
        await this.prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            retryCount: retries,
            errorMessage: String(err?.message ?? err),
            completedAt: new Date(),
          },
        });
        this.logger.error(`Job ${job.id} permanently failed after ${retries} attempts.`);
      }
    } catch (nestedErr: any) {
      this.logger.error(`Failed to update failure state for job ${job.id}:`, nestedErr);
    }
  }

  // ── Crash recovery ─────────────────────────────────────────────────────────

  private async recoverRunningJobs() {
    try {
      const stuck = await this.prisma.job.findMany({ where: { status: JobStatus.RUNNING } });
      for (const job of stuck) {
        this.logger.warn(`Crash recovery: stuck RUNNING job ${job.id} (${job.type})`);
        const retries = job.retryCount + 1;
        if (retries < 3) {
          await this.prisma.job.update({
            where: { id: job.id },
            data: {
              status: JobStatus.QUEUED,
              retryCount: retries,
              errorMessage: 'Server restarted during execution — auto re-queued.',
            },
          });
        } else {
          await this.prisma.job.update({
            where: { id: job.id },
            data: {
              status: JobStatus.FAILED,
              retryCount: retries,
              errorMessage: 'Server restarted during execution — permanently failed (retry cap).',
              completedAt: new Date(),
            },
          });
        }
      }
    } catch (err: any) {
      this.logger.error('Crash recovery failed:', err);
    }
  }

  // ── Job dispatcher ─────────────────────────────────────────────────────────

  private async executeJob(job: Job) {
    switch (job.type) {
      case JobType.SPLIT_DOCUMENT:
        await this.orchestrator.runSplitDocument(job.id);
        break;
      case JobType.RENDER_PAGE:
        await this.orchestrator.runRenderPage(job.id);
        break;
      case JobType.TRANSLATE_BATCH:
        await this.orchestrator.runTranslateBatch(job.id);
        break;
      case JobType.REVIEW_PAGE:
        await this.orchestrator.runReviewPage(job.id);
        break;
      case JobType.INDEX_MEMORY:
        if (!job.pageId) throw new Error('INDEX_MEMORY job missing pageId');
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
        throw new Error(`Unsupported job type: ${job.type}`);
    }
  }
}
