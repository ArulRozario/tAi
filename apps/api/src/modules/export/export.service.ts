import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportProject(projectId: string, format: 'text' | 'html' = 'html') {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        pages: {
          where: { status: 'APPROVED' },
          orderBy: { pageNumber: 'asc' },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    if (format === 'html') {
      return this.generateHtml(project);
    }
    return this.generateText(project);
  }

  private generateHtml(project: any): string {
    const pages = project.pages.map((page: any) => `
      <div class="page">
        <div class="page-number">Page ${page.pageNumber}</div>
        <div class="content">
          <h3>Original (${project.sourceLang})</h3>
          <pre>${this.escapeHtml(page.originalText || '')}</pre>
          <h3>Translation (${project.targetLang})</h3>
          <pre>${this.escapeHtml(page.translatedText || '')}</pre>
        </div>
      </div>
    `).join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(project.name)} - Translation Export</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    .page { margin-bottom: 40px; padding: 20px; border: 1px solid #ccc; }
    .page-number { font-size: 12px; color: #666; margin-bottom: 10px; }
    .content h3 { color: #555; margin-top: 20px; }
    pre { white-space: pre-wrap; font-size: 14px; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(project.name)}</h1>
  <p>Source: ${project.sourceLang} → Target: ${project.targetLang}</p>
  <p>Exported: ${new Date().toLocaleDateString()}</p>
  ${pages}
</body>
</html>`;
  }

  private generateText(project: any): string {
    const content = project.pages.map((page: any) => 
      `--- Page ${page.pageNumber} ---\n\nOriginal (${project.sourceLang}):\n${page.originalText || ''}\n\nTranslation (${project.targetLang}):\n${page.translatedText || ''}\n`
    ).join('\n');

    return `# ${project.name}\n\nSource: ${project.sourceLang} → Target: ${project.targetLang}\nExported: ${new Date().toLocaleDateString()}\n\n${content}`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}