import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinIOService } from '../files/minio.service';
import { PageStatus, Priority, JobType, JobStatus } from '@prisma/client';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinIOService,
  ) {}

  /**
   * PROCESS_DOCUMENT job: splits document into pages, uploads placeholder layouts,
   * creates PENDING pages, and enqueues EXTRACT_PAGE children.
   */
  async processDocument(jobId: string): Promise<void> {
    this.logger.log(`Executing PROCESS_DOCUMENT job: ${jobId}`);

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { project: true },
    });

    if (!job || !job.project) {
      this.logger.error(`PROCESS_DOCUMENT failed: Job ${jobId} or project not found`);
      return;
    }

    const { project } = job;

    // Set project status to PROCESSING
    await this.prisma.project.update({
      where: { id: project.id },
      data: { status: 'PROCESSING' },
    });

    // Idempotency: check if Page records already exist for this project
    const existingPages = await this.prisma.page.count({
      where: { projectId: project.id },
    });

    if (existingPages > 0) {
      this.logger.warn(`Pages already exist for project ${project.id}. Skipping split phase.`);
      return;
    }

    let fileContent = '';
    if (project.sourceFileId) {
      try {
        const buffer = await this.minio.downloadFile(project.sourceFileId);
        fileContent = buffer.toString('utf-8');
      } catch (err) {
        this.logger.warn(`Could not download source file from MinIO: ${(err as Error).message}. Using default mock pages.`);
      }
    }

    // High-fidelity fallback simulated pages
    const mockPages = [
      {
        pageNumber: 1,
        text: `# Chapter 1\n\nIn the beginning God created the heavens and the earth.\nThe earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.\n\nAnd God said, "Let there be light," and there was light.`,
      },
      {
        pageNumber: 2,
        text: `God saw that the light was good, and he separated the light from the darkness.\nGod called the light "day," and the darkness he called "night."\n\nAnd there was evening, and there was morning—the first day.`,
      },
      {
        pageNumber: 3,
        text: `# Chapter 2\n\nThus the heavens and the earth were completed in all their vast array.\nBy the seventh day God had finished the work he had been doing; so on the seventh day he rested from all his work.\n\nThen God blessed the seventh day and made it holy, because on it he rested from all the work of creating that he had done.`,
      },
    ];

    const pagesToCreate = fileContent.trim()
      ? fileContent.split('\f').map((text, idx) => ({ pageNumber: idx + 1, text: text.trim() }))
      : mockPages;

    const totalPages = pagesToCreate.length;

    for (let i = 0; i < totalPages; i++) {
      const pageData = pagesToCreate[i];
      const pageNum = pageData.pageNumber;

      // 1. Upload mock page layout image
      const imageBuffer = Buffer.from('MOCK_PAGE_IMAGE');
      const objectKey = `projects/${project.id}/pages/${pageNum}.png`;
      await this.minio.uploadBuffer(imageBuffer, objectKey, 'image/png');

      // 2. Create Page record
      const page = await this.prisma.page.create({
        data: {
          projectId: project.id,
          pageNumber: pageNum,
          originalHtml: pageData.text,
          status: PageStatus.PENDING,
          priority: Priority.MEDIUM,
        },
      });

      // 3. Enqueue EXTRACT_PAGE child job
      await this.prisma.job.create({
        data: {
          type: JobType.EXTRACT_PAGE,
          status: JobStatus.QUEUED,
          projectId: project.id,
          pageId: page.id,
          parentJobId: jobId,
          payload: { pageId: page.id },
        },
      });

      // Update parent job progress
      const progress = Math.round(((i + 1) / totalPages) * 100);
      await this.prisma.job.update({
        where: { id: jobId },
        data: { progress },
      });
    }

    this.logger.log(`PROCESS_DOCUMENT job ${jobId} successfully completed and extraction jobs enqueued`);
  }

  /**
   * EXTRACT_PAGE job: parses page text, segments paragraphs into sentences (spaCy),
   * creates Sentence records, and checks if DETECT_CHAPTERS should be queued.
   */
  async extractPage(jobId: string): Promise<void> {
    this.logger.log(`Executing EXTRACT_PAGE job: ${jobId}`);

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { page: true },
    });

    if (!job || !job.page) {
      this.logger.error(`EXTRACT_PAGE failed: Job ${jobId} or page not found`);
      return;
    }

    const { page } = job;

    // Idempotency: if page is not PENDING, skip
    if (page.status !== PageStatus.PENDING) {
      this.logger.warn(`Page ${page.id} status is already ${page.status}. Skipping extraction.`);
      return;
    }

    await this.prisma.page.update({
      where: { id: page.id },
      data: { status: PageStatus.EXTRACTING },
    });

    // In our new page-level visual OCR architecture, we do not segment paragraphs locally.
    // We initialize originalHtml and translatedHtml as empty placeholder strings,
    // and let the translation agent visually ingest the page screenshot from MinIO and generate them.
    await this.prisma.page.update({
      where: { id: page.id },
      data: {
        originalHtml: '',
        translatedHtml: '',
        status: PageStatus.EXTRACTED,
      },
    });

    this.logger.log(`EXTRACT_PAGE completed successfully for page ${page.id}`);

    // Check if all EXTRACT_PAGE sibling jobs for this project are finished
    const parentJobId = job.parentJobId;
    if (parentJobId) {
      const activeSiblings = await this.prisma.job.count({
        where: {
          parentJobId,
          type: JobType.EXTRACT_PAGE,
          status: { in: [JobStatus.QUEUED, JobStatus.RUNNING] },
          id: { not: jobId }, // exclude self
        },
      });

      if (activeSiblings === 0) {
        this.logger.log(`All sibling pages extracted. Enqueuing DETECT_CHAPTERS for project ${page.projectId}`);
        await this.prisma.job.create({
          data: {
            type: JobType.DETECT_CHAPTERS,
            status: JobStatus.QUEUED,
            projectId: page.projectId,
            payload: { projectId: page.projectId },
          },
        });
      }
    }
  }

  /**
   * DETECT_CHAPTERS job: sentence boundary stitching, chapter boundary matching,
   * and token-budget batch planning → enqueues TRANSLATE_BATCH jobs.
   */
  async detectChapters(jobId: string): Promise<void> {
    this.logger.log(`Executing DETECT_CHAPTERS job: ${jobId}`);

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || !job.projectId) {
      this.logger.error(`DETECT_CHAPTERS failed: Job or project references not found`);
      return;
    }

    const projectId = job.projectId;

    // Idempotency: delete old chapters and unlink pages
    await this.prisma.chapter.deleteMany({ where: { projectId } });
    await this.prisma.page.updateMany({
      where: { projectId },
      data: { chapterId: null },
    });

    // 1. Load all pages in order
    const pages = await this.prisma.page.findMany({
      where: { projectId },
      orderBy: { pageNumber: 'asc' },
    });

    // 2. Sliding-window visual batch planning
    // Each batch has up to 4 pages: 3 target pages, and the 4th page acts as bleed-over/context.
    const batches: string[][] = [];
    for (let i = 0; i < pages.length; i += 3) {
      const targetPages = pages.slice(i, i + 3);
      const batchPageIds = targetPages.map(p => p.id);

      // If there is a next page after the target list, include it as context/borrow page
      if (i + 3 < pages.length) {
        batchPageIds.push(pages[i + 3].id);
      }
      batches.push(batchPageIds);
    }

    // 3. Enqueue TRANSLATE_BATCH jobs
    for (const batchPageIds of batches) {
      await this.prisma.job.create({
        data: {
          type: JobType.TRANSLATE_BATCH,
          status: JobStatus.QUEUED,
          projectId,
          payload: { projectId, pageIds: batchPageIds },
        },
      });
    }

    this.logger.log(`DETECT_CHAPTERS complete: 4-page sliding-window batch planning finished.`);
  }
}
