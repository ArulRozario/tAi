import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorStatus, PageStatus } from '@prisma/client';

@Injectable()
export class ErrorsService {
  constructor(private prisma: PrismaService) {}

  async findMany(filters: { pageId?: string; status?: string }) {
    const where: any = {};

    if (filters.pageId) {
      where.pageId = filters.pageId;
    }

    if (filters.status) {
      where.status = filters.status.toUpperCase() as any;
    }

    return this.prisma.error.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const error = await this.prisma.error.findUnique({
      where: { id },
      include: {
        page: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!error) {
      throw new NotFoundException(`Error with ID ${id} not found`);
    }

    return error;
  }

  async apply(id: string, user: any) {
    const error = await this.findOne(id);

    if (error.status === ErrorStatus.APPLIED) {
      throw new ConflictException('This error has already been applied');
    }

    const page = error.page;
    let currentHtml = page.translatedHtml || '';

    if (!error.currentText || !error.suggestedText) {
      throw new BadRequestException('Error data does not support replacement');
    }

    // Replace the wrong translation snippet with suggested text inside continuous page HTML-lite
    currentHtml = currentHtml.replace(error.currentText, error.suggestedText);

    // Atomically mark error as APPLIED and update page translated HTML
    const [updatedError, updatedPage] = await this.prisma.$transaction([
      this.prisma.error.update({
        where: { id },
        data: {
          status: ErrorStatus.APPLIED,
          appliedAt: new Date(),
          appliedById: user.id,
        },
      }),
      this.prisma.page.update({
        where: { id: page.id },
        data: {
          translatedHtml: currentHtml,
          status: PageStatus.HUMAN_REVIEW,
        },
        include: { errors: true },
      }),
    ]);

    return { error: updatedError, page: updatedPage };
  }

  async reject(id: string) {
    await this.findOne(id);

    return this.prisma.error.update({
      where: { id },
      data: { status: ErrorStatus.REJECTED },
    });
  }

  async exception(id: string, data: { sourceTerm?: string; note?: string }) {
    const error = await this.findOne(id);

    const updatedError = await this.prisma.error.update({
      where: { id },
      data: {
        status: ErrorStatus.EXCEPTION,
        aiNote: data.note ? `${error.aiNote || ''}\nException note: ${data.note}`.trim() : error.aiNote,
      },
    });

    let glossaryTerm = null;
    if (data.sourceTerm) {
      const genreId = error.page.project.genreId;
      glossaryTerm = await this.prisma.glossaryTerm.upsert({
        where: {
          genreId_sourceTerm: {
            genreId,
            sourceTerm: data.sourceTerm,
          },
        },
        update: {
          targetTerm: error.currentText,
          notes: data.note || undefined,
        },
        create: {
          genreId,
          sourceTerm: data.sourceTerm,
          targetTerm: error.currentText,
          notes: data.note || undefined,
        },
      });
    }

    return { error: updatedError, glossaryTerm };
  }

  async escalate(id: string, data: { reason: string }, user: any) {
    if (!data.reason) {
      throw new BadRequestException('Escalation reason is required');
    }

    const error = await this.findOne(id);

    return this.prisma.error.update({
      where: { id },
      data: {
        status: ErrorStatus.ESCALATED,
        escalatedAt: new Date(),
        escalatedById: user.id,
        aiNote: `${error.aiNote || ''}\nEscalation reason: ${data.reason}`.trim(),
      },
    });
  }
}
