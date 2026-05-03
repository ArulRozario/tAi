import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PageStatus } from '@prisma/client';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  async findByProject(
    projectId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;

    const [pages, total] = await Promise.all([
      this.prisma.page.findMany({
        where: { projectId },
        skip,
        take: limit,
        orderBy: { pageNumber: 'asc' },
        select: {
          id: true,
          pageNumber: true,
          originalText: true,
          translatedText: true,
          status: true,
          qualityScore: true,
          priority: true,
          assignedReviewer: {
            select: { id: true, name: true },
          },
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.page.count({ where: { projectId } }),
    ]);

    return {
      data: pages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignedReviewer: {
          select: { id: true, name: true, email: true },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 10,
        },
        feedback: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    return page;
  }

  async createFromPDF(projectId: string, totalPages: number) {
    const pages = [];
    
    for (let i = 1; i <= totalPages; i++) {
      const page = await this.prisma.page.create({
        data: {
          projectId,
          pageNumber: i,
          status: PageStatus.PENDING,
          priority: 'NORMAL',
        },
      });
      pages.push(page);
    }

    return pages;
  }

  async updateStatus(id: string, status: PageStatus) {
    return this.prisma.page.update({
      where: { id },
      data: { status },
    });
  }

  async updateTranslation(id: string, translatedText: string, qualityScore?: number) {
    const page = await this.findOne(id);

    await this.prisma.pageVersion.create({
      data: {
        pageId: id,
        versionNumber: page.retryCount + 1,
        originalText: page.originalText,
        translatedText: page.translatedText,
        qualityScore: page.qualityScore,
      },
    });

    return this.prisma.page.update({
      where: { id },
      data: {
        translatedText,
        qualityScore: qualityScore ?? undefined,
        status: PageStatus.TRANSLATED,
      },
    });
  }

  async reassign(id: string, reviewerId: string | null) {
    return this.prisma.page.update({
      where: { id },
      data: {
        assignedReviewerId: reviewerId,
      },
    });
  }

  async getQueue(reviewerId?: string, priority?: string, limit: number = 20) {
    const where: Record<string, unknown> = {
      status: { in: [PageStatus.REVIEWING, PageStatus.HUMAN_REVIEW] },
    };

    if (reviewerId) {
      where.assignedReviewerId = reviewerId;
    }

    if (priority) {
      where.priority = priority.toUpperCase();
    }

    const pages = await this.prisma.page.findMany({
      where,
      take: limit,
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'asc' },
      ],
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignedReviewer: {
          select: { id: true, name: true },
        },
      },
    });

    return pages;
  }
}