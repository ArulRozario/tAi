import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GlossaryService {
  private readonly logger = new Logger(GlossaryService.name);

  constructor(private prisma: PrismaService) {}

  async findMany(filters: { genreId?: string; q?: string; limit: number }) {
    const where: any = {};

    if (filters.genreId) {
      where.styleGuideId = filters.genreId;
    }

    if (filters.q) {
      where.OR = [
        { sourceTerm: { contains: filters.q, mode: 'insensitive' } },
        { targetTerm: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.glossaryTerm.findMany({
      where,
      take: filters.limit,
      orderBy: { sourceTerm: 'asc' },
    });
  }

  async findOne(id: string) {
    const term = await this.prisma.glossaryTerm.findUnique({
      where: { id },
    });
    if (!term) {
      throw new NotFoundException(`Glossary term with ID ${id} not found`);
    }
    return term;
  }

  async create(data: {
    genreId: string;
    sourceTerm: string;
    targetTerm: string;
    context?: string;
    notes?: string;
  }) {
    // Check if duplicate sourceTerm for this genre
    const existing = await this.prisma.glossaryTerm.findUnique({
      where: {
        styleGuideId_sourceTerm: {
          styleGuideId: data.genreId,
          sourceTerm: data.sourceTerm,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `A glossary term for "${data.sourceTerm}" already exists in this genre`
      );
    }

    return this.prisma.glossaryTerm.create({
      data: {
        styleGuideId: data.genreId,
        sourceTerm: data.sourceTerm,
        targetTerm: data.targetTerm,
        context: data.context || null,
        notes: data.notes || null,
      },
    });
  }

  async update(
    id: string,
    data: { targetTerm?: string; context?: string; notes?: string }
  ) {
    await this.findOne(id);

    const updateData: any = {};
    if (data.targetTerm !== undefined) {
      updateData.targetTerm = data.targetTerm;
    }
    if (data.context !== undefined) {
      updateData.context = data.context;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    return this.prisma.glossaryTerm.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.glossaryTerm.delete({
      where: { id },
    });
  }

  async bulkCreate(data: {
    genreId: string;
    terms: Array<{ sourceTerm: string; targetTerm: string; context?: string }>;
  }) {
    let created = 0;
    for (const term of data.terms) {
      if (!term.sourceTerm || !term.targetTerm) {
        continue;
      }

      await this.prisma.glossaryTerm.upsert({
        where: {
          styleGuideId_sourceTerm: {
            styleGuideId: data.genreId,
            sourceTerm: term.sourceTerm,
          },
        },
        update: {
          targetTerm: term.targetTerm,
          context: term.context || undefined,
        },
        create: {
          styleGuideId: data.genreId,
          sourceTerm: term.sourceTerm,
          targetTerm: term.targetTerm,
          context: term.context || undefined,
        },
      });

      created++;
    }

    this.logger.log(`Bulk created ${created} glossary terms for genre ${data.genreId}`);
    return { created };
  }
}
