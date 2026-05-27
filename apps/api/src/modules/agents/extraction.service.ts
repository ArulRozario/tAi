import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinIOService } from '../files/minio.service';
import { PageStatus, Priority } from '@prisma/client';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

const execFileAsync = promisify(execFile);

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinIOService,
  ) {}

  /**
   * SPLIT_DOCUMENT job: downloads the PDF once, renders every page to PNG
   * using pdftoppm (reusing the single download), uploads each PNG to MinIO,
   * and marks pages READY — no separate RENDER_PAGE jobs needed.
   */
  async splitDocument(jobId: string): Promise<void> {
    this.logger.log(`Executing SPLIT_DOCUMENT job: ${jobId}`);

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { project: true },
    });

    if (!job || !job.project) {
      this.logger.error(`SPLIT_DOCUMENT failed: Job ${jobId} or project not found`);
      return;
    }

    const { project } = job;

    await this.prisma.project.update({
      where: { id: project.id },
      data: { status: 'PROCESSING' },
    });

    // Idempotency: skip if pages already exist
    const existingPages = await this.prisma.page.count({
      where: { projectId: project.id },
    });

    if (existingPages > 0) {
      this.logger.warn(`Pages already exist for project ${project.id}. Skipping split phase.`);
      return;
    }

    if (!project.sourceFileId) {
      throw new Error(`Project ${project.id} has no source file.`);
    }

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tai-split-'));
    const pdfPath = path.join(tmpDir, 'source.pdf');

    try {
      // Download the PDF exactly once for the entire job
      const buffer = await this.minio.downloadFile(project.sourceFileId);
      await fs.writeFile(pdfPath, buffer);

      const totalPages = await this.getPageCount(pdfPath);
      this.logger.log(`PDF has ${totalPages} pages — rendering inline (no RENDER_PAGE jobs)`);

      // Create all page rows as PENDING so the UI shows them immediately
      const pageRows: { id: string; pageNumber: number }[] = [];
      for (let i = 1; i <= totalPages; i++) {
        const page = await this.prisma.page.create({
          data: {
            projectId: project.id,
            pageNumber: i,
            status: PageStatus.PENDING,
            priority: Priority.MEDIUM,
          },
        });
        pageRows.push({ id: page.id, pageNumber: i });
      }

      // Render and upload each page, reusing the single PDF already on disk
      for (let i = 0; i < pageRows.length; i++) {
        const { id, pageNumber } = pageRows[i];

        await this.prisma.page.update({
          where: { id },
          data: { status: PageStatus.RENDERING },
        });

        const pngBuffer = await this.renderPageToPng(pdfPath, pageNumber);
        const objectKey = `projects/${project.id}/pages/${pageNumber}.png`;
        await this.minio.uploadBuffer(pngBuffer, objectKey, 'image/png');

        await this.prisma.page.update({
          where: { id },
          data: { status: PageStatus.READY },
        });

        await this.prisma.job.update({
          where: { id: jobId },
          data: { progress: Math.round(((i + 1) / totalPages) * 100) },
        });
      }

      this.logger.log(`SPLIT_DOCUMENT job ${jobId} complete — ${totalPages} pages extracted and uploaded`);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }

  /**
   * RENDER_PAGE job: downloads the PDF, converts the specific page to PNG
   * using pdftoppm, uploads to MinIO, and marks the page READY.
   */
  async renderPage(jobId: string): Promise<void> {
    this.logger.log(`Executing RENDER_PAGE job: ${jobId}`);

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { page: true },
    });

    if (!job || !job.page) {
      this.logger.error(`RENDER_PAGE failed: Job ${jobId} or page not found`);
      return;
    }

    const { page } = job;

    if (page.status !== PageStatus.PENDING) {
      this.logger.warn(`Page ${page.id} is already ${page.status}. Skipping render.`);
      return;
    }

    await this.prisma.page.update({
      where: { id: page.id },
      data: { status: PageStatus.RENDERING },
    });

    const project = await this.prisma.project.findUnique({
      where: { id: page.projectId },
    });

    if (!project?.sourceFileId) {
      throw new Error(`Project ${page.projectId} has no source file.`);
    }

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tai-render-'));
    const pdfPath = path.join(tmpDir, 'source.pdf');

    try {
      const buffer = await this.minio.downloadFile(project.sourceFileId);
      await fs.writeFile(pdfPath, buffer);

      const pngBuffer = await this.renderPageToPng(pdfPath, page.pageNumber);

      const objectKey = `projects/${page.projectId}/pages/${page.pageNumber}.png`;
      await this.minio.uploadBuffer(pngBuffer, objectKey, 'image/png');

      await this.prisma.page.update({
        where: { id: page.id },
        data: { status: PageStatus.READY },
      });

      this.logger.log(`RENDER_PAGE complete for page ${page.id} (page ${page.pageNumber})`);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }

  private async getPageCount(pdfPath: string): Promise<number> {
    const { stdout } = await execFileAsync('pdfinfo', [pdfPath]);
    const match = stdout.match(/^Pages:\s+(\d+)/m);
    if (!match) throw new Error('Could not determine page count from pdfinfo output');
    return parseInt(match[1], 10);
  }

  private async renderPageToPng(pdfPath: string, pageNumber: number): Promise<Buffer> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tai-png-'));
    try {
      // pdftoppm -r 150 -f <page> -l <page> -png <input> <output-prefix>
      // produces <output-prefix>-<padded-page>.png
      const outPrefix = path.join(tmpDir, 'page');
      await execFileAsync('pdftoppm', [
        '-r', '150',
        '-f', String(pageNumber),
        '-l', String(pageNumber),
        '-png',
        pdfPath,
        outPrefix,
      ]);

      const files = await fs.readdir(tmpDir);
      const pngFile = files.find(f => f.endsWith('.png'));
      if (!pngFile) throw new Error(`pdftoppm produced no PNG for page ${pageNumber}`);

      return fs.readFile(path.join(tmpDir, pngFile));
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }
}
