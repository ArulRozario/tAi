import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PageStatus, ErrorStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getPages(filters: {
    projectId?: string;
    chapterId?: string;
    status?: string;
    reviewerId?: string;
    limit: number;
    offset: number;
  }) {
    const where: any = {};

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.chapterId) where.chapterId = filters.chapterId;
    if (filters.status) where.status = filters.status.toUpperCase() as PageStatus;
    if (filters.reviewerId) {
      where.reviewers = { some: { userId: filters.reviewerId } };
    }

    const [pages, total] = await Promise.all([
      this.prisma.page.findMany({
        where,
        skip: filters.offset,
        take: filters.limit,
        orderBy: [{ priority: 'desc' }, { pageNumber: 'asc' }],
        include: {
          project: { select: { id: true, name: true, sourceLang: true, targetLang: true } },
          chapter: { select: { id: true, number: true, title: true } },
          reviewers: {
            include: { user: { select: { id: true, name: true, email: true, role: true } } },
          },
        },
      }),
      this.prisma.page.count({ where }),
    ]);

    return {
      data: pages.map((p) => ({
        ...p,
        reviewers: p.reviewers.map((r) => r.user),
      })),
      total,
    };
  }

  async bulkReassign(pageIds: string[], reviewerId: string) {
    const reviewer = await this.prisma.user.findUnique({
      where: { id: reviewerId },
      select: { id: true, isActive: true },
    });

    if (!reviewer || !reviewer.isActive) {
      throw new BadRequestException('Reviewer not found or inactive');
    }

    let updated = 0;
    for (const pageId of pageIds) {
      const page = await this.prisma.page.findUnique({ where: { id: pageId } });
      if (!page) continue;

      await this.prisma.$transaction([
        this.prisma.pageReviewer.deleteMany({ where: { pageId } }),
        this.prisma.pageReviewer.create({
          data: { pageId, userId: reviewerId, isPrimary: true },
        }),
      ]);
      updated++;
    }

    return { updated };
  }

  async bulkApprove(pageIds: string[]) {
    let updated = 0;
    let skipped = 0;

    for (const pageId of pageIds) {
      const openErrorCount = await this.prisma.error.count({
        where: {
          pageId,
          status: ErrorStatus.OPEN,
        },
      });

      if (openErrorCount > 0) {
        skipped++;
        continue;
      }

      await this.prisma.page.update({
        where: { id: pageId },
        data: { status: PageStatus.APPROVED },
      });
      updated++;
    }

    return { updated, skipped };
  }

  async overridePage(pageId: string, status: string, reason: string) {
    const page = await this.prisma.page.findUnique({ where: { id: pageId } });
    if (!page) throw new NotFoundException('Page not found');

    const updated = await this.prisma.page.update({
      where: { id: pageId },
      data: {
        status: status.toUpperCase() as PageStatus,
        notes: page.notes
          ? `${page.notes}\n[ADMIN OVERRIDE] ${reason}`
          : `[ADMIN OVERRIDE] ${reason}`,
      },
    });

    return updated;
  }
}
