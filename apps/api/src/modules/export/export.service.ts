import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinIOService } from '../files/minio.service';
import { JobType, JobStatus, PageStatus } from '@prisma/client';
 
const PDFDocument = require('pdfkit');
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinIOService,
  ) {}

  async enqueueProjectExport(projectId: string, format: string, scope: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const job = await this.prisma.job.create({
      data: { type: JobType.EXPORT_PROJECT, status: JobStatus.QUEUED, projectId, payload: { format, scope } },
    });
    return { jobId: job.id };
  }

  async enqueuePageReport(pageId: string) {
    const page = await this.prisma.page.findUnique({ where: { id: pageId } });
    if (!page) throw new NotFoundException('Page not found');

    const job = await this.prisma.job.create({
      data: { type: JobType.EXPORT_PAGE_REPORT, status: JobStatus.QUEUED, pageId, projectId: page.projectId, payload: { pageId } },
    });
    return { jobId: job.id };
  }

  async enqueueAdminReport(projectIds?: string[], format = 'pdf') {
    const job = await this.prisma.job.create({
      data: { type: JobType.EXPORT_ADMIN_REPORT, status: JobStatus.QUEUED, payload: { projectIds: projectIds ?? [], format } },
    });
    return { jobId: job.id };
  }

  async runExportProject(jobId: string, projectId: string, format: string, scope: string) {
    const statusFilter = scope === 'approved' ? [PageStatus.APPROVED] : undefined;

    const pages = await this.prisma.page.findMany({
      where: {
        projectId,
        ...(statusFilter ? { status: { in: statusFilter } } : {}),
      },
      orderBy: { pageNumber: 'asc' },
    });

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { genre: { select: { name: true } } },
    });
    if (!project) throw new NotFoundException('Project not found');

    const reconstructed = pages.map((page) => {
      // Use the continuous visual Tamil translation HTML, fallback to original transcription HTML
      const contentHtml = page.translatedHtml || page.originalHtml || '';
      return { pageNumber: page.pageNumber, content: contentHtml };
    });

    let buffer: Buffer;
    let contentType: string;
    let ext: string;

    if (format === 'pdf') {
      buffer = await this.generatePdf(project.name, reconstructed);
      contentType = 'application/pdf';
      ext = 'pdf';
    } else if (format === 'docx') {
      buffer = await this.generateDocx(project.name, reconstructed);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      ext = 'docx';
    } else if (format === 'html') {
      buffer = Buffer.from(this.generateHtml(project.name, project.sourceLang, project.targetLang, reconstructed), 'utf8');
      contentType = 'text/html';
      ext = 'html';
    } else {
      buffer = Buffer.from(this.generateText(project.name, reconstructed), 'utf8');
      contentType = 'text/plain';
      ext = 'txt';
    }

    const key = `exports/${projectId}/${Date.now()}-export.${ext}`;
    const fileUrl = await this.minio.uploadBuffer(buffer, key, contentType);

    await this.prisma.job.update({
      where: { id: jobId },
      data: { result: { fileUrl } },
    });
  }

  async runExportPageReport(jobId: string, pageId: string) {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: {
        errors: {
          orderBy: { createdAt: 'asc' },
        },
        project: { select: { name: true, sourceLang: true, targetLang: true } },
      },
    });
    if (!page) throw new NotFoundException('Page not found');

    const lines: string[] = [
      `# Quality Report — ${page.project.name} / Page ${page.pageNumber}`,
      `Quality score: ${page.quality ?? 'N/A'} / 100`,
      `Status: ${page.status}`,
      `Priority: ${page.priority}`,
      '',
      `## Continuous HTML Page Content`,
      `**Original HTML:**`,
      page.originalHtml || '(none)',
      '',
      `**Translated HTML:**`,
      page.translatedHtml || '(none)',
      '',
      '## QA Visual Errors',
    ];

    if (page.errors.length > 0) {
      for (const err of page.errors) {
        lines.push(`\n### Error [${err.severity}] - Category: ${err.category}`);
        lines.push(`**Location:** ${err.location}`);
        lines.push(`**Current text:** ${err.currentText}`);
        lines.push(`**Suggested text:** ${err.suggestedText}`);
        lines.push(`**Description:** ${err.issueDescription}`);
        if (err.aiNote) lines.push(`**Reasoning:** ${err.aiNote}`);
      }
    } else {
      lines.push('No errors detected on this page!');
    }

    const buffer = Buffer.from(lines.join('\n'), 'utf8');
    const key = `exports/${page.projectId}/reports/${Date.now()}-page-${page.pageNumber}-report.txt`;
    const fileUrl = await this.minio.uploadBuffer(buffer, key, 'text/plain');

    await this.prisma.job.update({
      where: { id: jobId },
      data: { result: { fileUrl } },
    });
  }

  async runExportAdminReport(jobId: string, projectIds: string[], format: string) {
    const where = projectIds.length > 0 ? { id: { in: projectIds } } : {};

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        _count: { select: { pages: true } },
      },
    });

    const lines: string[] = ['# Admin Aggregate Quality Report', ''];

    for (const project of projects) {
      const [approvedCount, totalCount, avgQuality] = await Promise.all([
        this.prisma.page.count({ where: { projectId: project.id, status: PageStatus.APPROVED } }),
        this.prisma.page.count({ where: { projectId: project.id } }),
        this.prisma.page.aggregate({
          where: { projectId: project.id, quality: { not: null } },
          _avg: { quality: true },
        }),
      ]);

      const progress = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;
      lines.push(`## ${project.name}`);
      lines.push(`Status: ${project.status} | Progress: ${progress}% (${approvedCount}/${totalCount} pages)`);
      lines.push(`Avg quality: ${Math.round(avgQuality._avg.quality ?? 0)}/100`);
      lines.push('');
    }

    const buffer = Buffer.from(lines.join('\n'), 'utf8');
    const key = `exports/admin/${Date.now()}-admin-report.txt`;
    const fileUrl = await this.minio.uploadBuffer(buffer, key, 'text/plain');

    await this.prisma.job.update({
      where: { id: jobId },
      data: { result: { fileUrl } },
    });
  }

  private async generatePdf(title: string, pages: { pageNumber: number; content: string }[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();

      for (const page of pages) {
        doc.addPage();
        doc.fontSize(12).text(`Page ${page.pageNumber}`, { underline: true });
        doc.moveDown(0.5);
        const plainText = page.content.replace(/\{\{SENTENCE_\d+\}\}/g, '').replace(/#{1,6}\s/g, '').trim();
        doc.fontSize(10).text(plainText, { lineGap: 4 });
      }

      doc.end();
    });
  }

  private async generateDocx(title: string, pages: { pageNumber: number; content: string }[]): Promise<Buffer> {
    const docChildren: Paragraph[] = [
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
      }),
    ];

    for (const page of pages) {
      docChildren.push(
        new Paragraph({
          text: `Page ${page.pageNumber}`,
          heading: HeadingLevel.HEADING_1,
        }),
      );

      const lines = page.content
        .replace(/\{\{SENTENCE_\d+\}\}/g, '')
        .split('\n')
        .filter((l) => l.trim());

      for (const line of lines) {
        const text = line.replace(/^#{1,6}\s+/, '').trim();
        if (!text) continue;
        docChildren.push(
          new Paragraph({ children: [new TextRun(text)] }),
        );
      }
    }

    const doc = new Document({ sections: [{ children: docChildren }] });
    return Packer.toBuffer(doc);
  }

  private generateHtml(title: string, sourceLang: string, targetLang: string, pages: { pageNumber: number; content: string }[]): string {
    const body = pages
      .map(
        (p) =>
          `<section><h2>Page ${p.pageNumber}</h2><pre>${this.escapeHtml(p.content)}</pre></section>`,
      )
      .join('\n');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${this.escapeHtml(title)}</title></head><body><h1>${this.escapeHtml(title)}</h1><p>${sourceLang} → ${targetLang}</p>${body}</body></html>`;
  }

  private generateText(title: string, pages: { pageNumber: number; content: string }[]): string {
    return [
      `# ${title}`,
      '',
      ...pages.map((p) => `--- Page ${p.pageNumber} ---\n\n${p.content}`),
    ].join('\n\n');
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
