import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';
const PDFDocument = require('pdfkit');
import { generateDocxBuffer } from '../../shared/docx-generator';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a PDF from all translated pages of a project.
   * Streams the PDF buffer directly to the Express response.
   */
  async exportPdf(projectId: string, res: Response): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        pages: {
          where: { translatedHtml: { not: null } },
          orderBy: { pageNumber: 'asc' },
          select: {
            pageNumber: true,
            translatedHtml: true,
            originalHtml: true,
          },
        },
        styleGuide: { select: { name: true } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found.`);
    }

    if (project.pages.length === 0) {
      throw new NotFoundException('No translated pages found for this project.');
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.sanitizeFilename(project.name)}.pdf"`,
    );

    doc.pipe(res);

    // Title page
    doc.fontSize(24).text(project.name, 50, 100, { align: 'center' });
    if (project.description) {
      doc.fontSize(12).text(project.description, 50, 150, { align: 'center' });
    }
    doc
      .fontSize(10)
      .text(
        `${project.sourceLang} → ${project.targetLang} · ${project.styleGuide?.name || ''}`,
        50,
        200,
        { align: 'center' },
      );

    doc.addPage();

    // Content pages
    for (const page of project.pages) {
      const text = this.htmlToPlainText(page.translatedHtml || '');
      if (!text.trim()) continue;

      doc.fontSize(10).font('Helvetica');
      doc.text(text, { align: 'left', paragraphGap: 8 });
      doc.addPage();
    }

    doc.end();
    this.logger.log(`[Project ${projectId}] PDF exported (${project.pages.length} pages)`);
  }

  /**
   * Generates a DOCX from all translated pages of a project.
   * Uses the docx library for proper complex-script (Tamil) font support.
   */
  async exportDocx(projectId: string, res: Response): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        pages: {
          where: { translatedHtml: { not: null } },
          orderBy: { pageNumber: 'asc' },
          select: {
            pageNumber: true,
            translatedHtml: true,
            originalHtml: true,
          },
        },
        styleGuide: { select: { name: true } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found.`);
    }

    if (project.pages.length === 0) {
      throw new NotFoundException('No translated pages found for this project.');
    }

    const docxBuffer = await generateDocxBuffer(
      {
        name: project.name,
        description: project.description,
        sourceLang: project.sourceLang,
        targetLang: project.targetLang,
        styleGuideName: project.styleGuide?.name ?? null,
      },
      project.pages.map((p) => ({
        pageNumber: p.pageNumber,
        content: p.translatedHtml || '',
      })),
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.sanitizeFilename(project.name)}.docx"`,
    );
    res.send(docxBuffer);

    this.logger.log(`[Project ${projectId}] DOCX exported (${project.pages.length} pages)`);
  }

  /**
   * Exports all translated pages as a single HTML file.
   */
  async exportHtml(projectId: string, res: Response): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        pages: {
          where: { translatedHtml: { not: null } },
          orderBy: { pageNumber: 'asc' },
          select: { pageNumber: true, translatedHtml: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found.`);
    }

    if (project.pages.length === 0) {
      throw new NotFoundException('No translated pages found for this project.');
    }

    let html = `<!DOCTYPE html>
<html lang="${project.targetLang}">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(project.name)}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; line-height: 1.6; color: #333; }
    h1 { text-align: center; border-bottom: 2px solid #ddd; padding-bottom: 20px; }
    .page { margin: 40px 0; padding: 20px 0; border-bottom: 1px solid #eee; }
    .page-number { color: #888; font-size: 0.85em; margin-bottom: 10px; }
    .segment { display: inline; }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(project.name)}</h1>
`;

    for (const page of project.pages) {
      html += `  <div class="page">
    <div class="page-number">Page ${page.pageNumber}</div>
    ${page.translatedHtml || ''}
  </div>
`;
    }

    html += `</body>\n</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.sanitizeFilename(project.name)}.html"`,
    );
    res.send(html);

    this.logger.log(`[Project ${projectId}] HTML exported (${project.pages.length} pages)`);
  }

  /**
   * Exports all translated pages as plain text.
   */
  async exportText(projectId: string, res: Response): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        pages: {
          where: { translatedHtml: { not: null } },
          orderBy: { pageNumber: 'asc' },
          select: { pageNumber: true, translatedHtml: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found.`);
    }

    if (project.pages.length === 0) {
      throw new NotFoundException('No translated pages found for this project.');
    }

    let text = `${project.name}\n${'='.repeat(project.name.length)}\n\n`;

    for (const page of project.pages) {
      const pageText = this.htmlToPlainText(page.translatedHtml || '');
      if (!pageText.trim()) continue;
      text += `--- Page ${page.pageNumber} ---\n\n${pageText}\n\n`;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${this.sanitizeFilename(project.name)}.txt"`,
    );
    res.send(text);

    this.logger.log(`[Project ${projectId}] Text exported (${project.pages.length} pages)`);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Strips HTML tags and decodes common entities into plain text.
   * Preserves paragraph breaks by converting block-level tags to double newlines.
   */
  private htmlToPlainText(html: string): string {
    if (!html) return '';

    return html
      // Replace block-level tags with newlines
      .replace(/<\/(?:p|div|h[1-6]|li|tr|section|article)>/gi, '\n')
      .replace(/<(?:br\s*\/?)>/gi, '\n')
      // Remove all remaining HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode common HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&ndash;/g, '–')
      .replace(/&mdash;/g, '—')
      // Collapse multiple spaces/newlines
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF._-]/g, '_').substring(0, 100);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
