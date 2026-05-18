import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PageStatus, ErrorStatus, ErrorCategory } from '@prisma/client';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(private prisma: PrismaService) {
    // logger available for future queue diagnostics
    void this.logger;
  }

  async getSubmittedReviews(filters: { limit: number; offset: number }) {
    const where: any = {
      status: PageStatus.HUMAN_REVIEW,
      submittedAt: { not: null },
    };

    const [pages, total] = await Promise.all([
      this.prisma.page.findMany({
        where,
        skip: filters.offset,
        take: filters.limit,
        orderBy: [{ submittedAt: 'desc' }],
        include: {
          project: { select: { id: true, name: true, sourceLang: true, targetLang: true } },
          chapter: { select: { id: true, number: true, title: true } },
          reviewers: {
            include: { user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } } },
          },
          _count: { select: { errors: true } },
        },
      }),
      this.prisma.page.count({ where }),
    ]);

    const result = await Promise.all(
      pages.map(async (p) => {
        const errorCount = await this.prisma.error.count({
          where: { pageId: p.id, status: ErrorStatus.OPEN },
        });
        return {
          id: p.id,
          pageNumber: p.pageNumber,
          project: p.project,
          chapter: p.chapter,
          status: p.status,
          priority: p.priority,
          quality: p.quality,
          assignedAt: p.assignedAt,
          submittedAt: (p as any).submittedAt,
          submittedById: (p as any).submittedById,
          errorCount,
          reviewers: p.reviewers.map((r) => r.user),
        };
      }),
    );

    return { data: result, total };
  }

  async getQueue(filters: {
    sort?: 'priority' | 'waitTime' | 'quality';
    errorTypes?: string[];
    reviewerId?: string;
    userId: string;
    limit: number;
    offset: number;
    lowQualityOnly?: boolean;
  }) {
    const where: any = {
      status: { in: [PageStatus.HUMAN_REVIEW] },
    };

    if (filters.lowQualityOnly) {
      where.quality = { lt: 70 };
    }

    if (filters.reviewerId === 'me') {
      where.reviewers = { some: { userId: filters.userId } };
    } else if (filters.reviewerId) {
      where.reviewers = { some: { userId: filters.reviewerId } };
    }

    if (filters.errorTypes?.length) {
      where.errors = {
        some: {
          category: { in: filters.errorTypes as ErrorCategory[] },
          status: ErrorStatus.OPEN,
        },
      };
    }

    let orderBy: any;
    switch (filters.sort) {
      case 'waitTime':
        orderBy = { assignedAt: 'asc' };
        break;
      case 'quality':
        orderBy = [{ quality: 'asc' }, { priority: 'desc' }];
        break;
      default:
        orderBy = [
          { priority: 'desc' },
          { quality: 'asc' },
          { assignedAt: 'asc' },
        ];
    }

    const [pages, total] = await Promise.all([
      this.prisma.page.findMany({
        where,
        skip: filters.offset,
        take: filters.limit,
        orderBy,
        include: {
          project: { select: { id: true, name: true, sourceLang: true, targetLang: true } },
          chapter: { select: { id: true, number: true, title: true } },
          reviewers: {
            include: { user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } } },
          },
          _count: {
            select: {
              errors: true,
            },
          },
        },
      }),
      this.prisma.page.count({ where }),
    ]);

    const result = await Promise.all(
      pages.map(async (p) => {
        const errorCount = await this.prisma.error.count({
          where: {
            pageId: p.id,
            status: ErrorStatus.OPEN,
          },
        });
        return {
          id: p.id,
          pageNumber: p.pageNumber,
          project: p.project,
          chapter: p.chapter,
          status: p.status,
          priority: p.priority,
          quality: p.quality,
          assignedAt: p.assignedAt,
          errorCount,
          reviewers: p.reviewers.map((r) => r.user),
        };
      }),
    );

    return { data: result, total };
  }

  async getErrorStats() {
    const categories = Object.values(ErrorCategory);

    const stats = await Promise.all(
      categories.map(async (category) => {
        const [openCount, resolvedCount, example] = await Promise.all([
          this.prisma.error.count({
            where: { category, status: ErrorStatus.OPEN },
          }),
          this.prisma.error.count({
            where: {
              category,
              status: { in: [ErrorStatus.APPLIED, ErrorStatus.EXCEPTION] },
            },
          }),
          this.prisma.error.findFirst({
            where: { category, status: ErrorStatus.OPEN },
            select: { currentText: true, severity: true },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

        return {
          category,
          count: openCount,
          severity: example?.severity ?? null,
          exampleText: example?.currentText ?? null,
          resolvedCount,
        };
      }),
    );

    return stats.filter((s) => s.count > 0 || s.resolvedCount > 0);
  }

  async getEscalations() {
    const pages = await this.prisma.page.findMany({
      where: { status: PageStatus.HUMAN_REVIEW },
      orderBy: { updatedAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
        chapter: { select: { id: true, number: true, title: true } },
        errors: {
          where: { status: ErrorStatus.ESCALATED },
          select: {
            category: true,
            escalatedAt: true,
            escalatedById: true,
            issueDescription: true,
          },
          take: 1,
        },
      },
    });

    return pages.map((p) => {
      const topError = p.errors[0];
      return {
        pageId: p.id,
        project: p.project,
        chapter: p.chapter,
        errorCategory: topError?.category ?? null,
        escalatedAt: topError?.escalatedAt ?? p.updatedAt,
        escalatedById: topError?.escalatedById ?? null,
        summary: topError?.issueDescription ?? null,
      };
    });
  }
}
