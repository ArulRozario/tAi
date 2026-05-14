import {
  Controller,
  Param,
  Body,
  Post,
  Get,
  UseGuards,
  Logger,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { JobType, JobStatus, PageStatus } from '@prisma/client';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TranslationController {
  private readonly logger = new Logger(TranslationController.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enqueues TRANSLATE_BATCH jobs for all pending pages in the project.
   * Uses the same 3-page sliding-window batching strategy as the extraction pipeline.
   * Pause / Resume / Stop are handled by the existing project-level job endpoints.
   */
  @Post(':id/translate')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  @HttpCode(HttpStatus.ACCEPTED)
  async startTranslation(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() body: { model?: string },
  ): Promise<{ jobCount: number; message: string }> {
    const pages = await this.prisma.page.findMany({
      where: {
        projectId,
        status: { in: [PageStatus.READY, PageStatus.TRANSLATION_ERROR] },
      },
      orderBy: { pageNumber: 'asc' },
      select: { id: true, pageNumber: true },
    });

    if (pages.length === 0) {
      return { jobCount: 0, message: 'No pages need translation.' };
    }

    // 3-page sliding window (4th page is context bleed)
    const batches: string[][] = [];
    for (let i = 0; i < pages.length; i += 3) {
      const batchPageIds = pages.slice(i, i + 3).map((p) => p.id);
      if (i + 3 < pages.length) batchPageIds.push(pages[i + 3].id);
      batches.push(batchPageIds);
    }

    for (const pageIds of batches) {
      await this.prisma.job.create({
        data: {
          type: JobType.TRANSLATE_BATCH,
          status: JobStatus.QUEUED,
          projectId,
          payload: { projectId, pageIds, modelOverride: body.model || null },
        },
      });
    }

    this.logger.log(
      `[Project ${projectId}] Enqueued ${batches.length} TRANSLATE_BATCH jobs for ${pages.length} pages`,
    );
    return {
      jobCount: batches.length,
      message: `Queued ${batches.length} translation batches (${pages.length} pages).`,
    };
  }

  /**
   * Returns a map of projectId → translation status for every project
   * that currently has active (QUEUED/RUNNING/PAUSED) TRANSLATE_BATCH jobs.
   * Used by the project list page to show live status without N requests.
   */
  @Get('translations/active')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  async getActiveTranslations(): Promise<
    Record<string, { isRunning: boolean; isPaused: boolean; done: number; total: number; percent: number }>
  > {
    const activeJobs = await this.prisma.job.findMany({
      where: {
        type: JobType.TRANSLATE_BATCH,
        status: { in: [JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.PAUSED] },
        projectId: { not: null },
      },
      select: { projectId: true, status: true },
    });

    if (activeJobs.length === 0) return {};

    const projectIds = [...new Set(activeJobs.map((j) => j.projectId as string))];

    // Aggregate job counts per project
    const jobCounts: Record<string, { queued: number; running: number; paused: number }> = {};
    for (const job of activeJobs) {
      const pid = job.projectId as string;
      if (!jobCounts[pid]) jobCounts[pid] = { queued: 0, running: 0, paused: 0 };
      if (job.status === JobStatus.QUEUED) jobCounts[pid].queued++;
      else if (job.status === JobStatus.RUNNING) jobCounts[pid].running++;
      else if (job.status === JobStatus.PAUSED) jobCounts[pid].paused++;
    }

    // Fetch page progress for all active projects in one query
    const pages = await this.prisma.page.findMany({
      where: { projectId: { in: projectIds } },
      select: { projectId: true, status: true },
    });

    const pageStats: Record<string, { total: number; done: number }> = {};
    for (const page of pages) {
      const pid = page.projectId;
      if (!pageStats[pid]) pageStats[pid] = { total: 0, done: 0 };
      pageStats[pid].total++;
      if (
        page.status === PageStatus.TRANSLATED ||
        page.status === PageStatus.HUMAN_REVIEW ||
        page.status === PageStatus.APPROVED
      ) {
        pageStats[pid].done++;
      }
    }

    const result: Record<string, any> = {};
    for (const pid of projectIds) {
      const jc = jobCounts[pid];
      const ps = pageStats[pid] ?? { total: 0, done: 0 };
      result[pid] = {
        isRunning: jc.running > 0 || jc.queued > 0,
        isPaused: jc.paused > 0 && jc.running === 0 && jc.queued === 0,
        done: ps.done,
        total: ps.total,
        percent: ps.total > 0 ? Math.round((ps.done / ps.total) * 100) : 0,
      };
    }
    return result;
  }

  /**
   * Snapshot of the current extraction pipeline state.
   * Frontend polls this on a 1.5s interval to drive the progress UI.
   * Returns { phase, pagesFound, pagesExtracted, isActive }.
   */
  @Get(':id/extract/progress')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  async getExtractionProgress(
    @Param('id', ParseUUIDPipe) projectId: string,
  ): Promise<{ phase: string; pagesFound: number; pagesRendered: number; isActive: boolean }> {
    const [splitJob, renderCount, pages] = await Promise.all([
      this.prisma.job.findFirst({
        where: { projectId, type: JobType.SPLIT_DOCUMENT, status: { in: [JobStatus.QUEUED, JobStatus.RUNNING] } },
      }),
      this.prisma.job.count({
        where: { projectId, type: JobType.RENDER_PAGE, status: { in: [JobStatus.QUEUED, JobStatus.RUNNING] } },
      }),
      this.prisma.page.findMany({ where: { projectId }, select: { status: true } }),
    ]);

    const pagesFound = pages.length;
    const pagesRendered = pages.filter(
      (p) => p.status !== 'PENDING' && p.status !== 'RENDERING',
    ).length;

    const isActive = !!(splitJob || renderCount > 0);

    let phase: string;
    if (!isActive) {
      const failedCount = await this.prisma.job.count({
        where: {
          projectId,
          type: { in: [JobType.SPLIT_DOCUMENT, JobType.RENDER_PAGE] },
          status: JobStatus.FAILED,
        },
      });
      phase = failedCount > 0 && pagesFound === 0 ? 'failed' : 'done';
    } else if (splitJob) {
      phase = 'splitting';
    } else {
      phase = 'rendering';
    }

    return { phase, pagesFound, pagesRendered, isActive };
  }

  /**
   * Returns the current translation job state and per-page statuses.
   * Frontend polls this to drive the progress UI.
   */
  @Get(':id/translate/progress')
  @Roles('ADMIN', 'MASTER', 'REVIEWER')
  async getTranslationProgress(
    @Param('id', ParseUUIDPipe) projectId: string,
  ) {
    const [activeJobs, pages] = await Promise.all([
      this.prisma.job.findMany({
        where: {
          projectId,
          type: JobType.TRANSLATE_BATCH,
          status: { in: [JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.PAUSED] },
        },
        select: { id: true, status: true },
      }),
      this.prisma.page.findMany({
        where: { projectId },
        orderBy: { pageNumber: 'asc' },
        select: { id: true, pageNumber: true, status: true },
      }),
    ]);

    const counts = { queued: 0, running: 0, paused: 0 };
    for (const job of activeJobs) {
      if (job.status === JobStatus.QUEUED) counts.queued++;
      else if (job.status === JobStatus.RUNNING) counts.running++;
      else if (job.status === JobStatus.PAUSED) counts.paused++;
    }

    const totalPages = pages.length;
    const translatedPages = pages.filter(
      (p) =>
        p.status === PageStatus.TRANSLATED ||
        p.status === PageStatus.HUMAN_REVIEW ||
        p.status === PageStatus.APPROVED,
    ).length;

    return {
      active: {
        total: activeJobs.length,
        queued: counts.queued,
        running: counts.running,
        paused: counts.paused,
        isRunning: counts.running > 0 || counts.queued > 0,
        isPaused: counts.paused > 0 && counts.running === 0 && counts.queued === 0,
        isActive: activeJobs.length > 0,
      },
      progress: {
        total: totalPages,
        done: translatedPages,
        percent: totalPages > 0 ? Math.round((translatedPages / totalPages) * 100) : 0,
      },
      pages,
    };
  }
}
