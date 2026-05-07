import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PageStatus,
  Priority,
  JobType,
  JobStatus,
  ErrorStatus,
} from '@prisma/client';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  async findByFilters(filters: {
    projectId?: string;
    chapterId?: string;
    status?: string;
    limit: number;
    offset: number;
  }) {
    const where: any = {};

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters.chapterId) {
      where.chapterId = filters.chapterId;
    }
    if (filters.status) {
      where.status = filters.status.toUpperCase() as PageStatus;
    }

    const [pages, total] = await Promise.all([
      this.prisma.page.findMany({
        where,
        skip: filters.offset,
        take: filters.limit,
        orderBy: { pageNumber: 'asc' },
        include: {
          reviewers: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
        },
      }),
      this.prisma.page.count({ where }),
    ]);

    return {
      data: pages,
      pagination: {
        offset: filters.offset,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, sourceLang: true, targetLang: true, genreId: true },
        },
        reviewers: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        errors: {
          orderBy: { createdAt: 'asc' },
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
          priority: Priority.MEDIUM,
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

  async updateTranslation(id: string, htmlContent: string, qualityScore?: number) {
    return this.prisma.page.update({
      where: { id },
      data: {
        translatedHtml: htmlContent,
        quality: qualityScore ?? undefined,
        status: PageStatus.TRANSLATED,
      },
    });
  }

  async updatePage(id: string, body: { notes?: string; priority?: string; status?: string }) {
    await this.findOne(id);

    const data: any = {};
    if (body.notes !== undefined) {
      data.notes = body.notes;
    }
    if (body.priority !== undefined) {
      data.priority = body.priority.toUpperCase() as Priority;
    }
    if (body.status !== undefined) {
      data.status = body.status.toUpperCase() as PageStatus;
    }

    return this.prisma.page.update({
      where: { id },
      data,
    });
  }

  async approve(id: string, body: { notes?: string }, user: any) {
    const page = await this.findOne(id);

    // Bypass validations only for MASTER and ADMIN
    if (user.role !== 'MASTER' && user.role !== 'ADMIN') {
      // 1. Block if there are any OPEN errors on the page
      const openErrorsCount = await this.prisma.error.count({
        where: { pageId: id, status: ErrorStatus.OPEN },
      });
      if (openErrorsCount > 0) {
        throw new ForbiddenException('Cannot approve page with open linting errors');
      }
    }

    let updatedNotes = page.notes;
    if (body.notes) {
      updatedNotes = `${page.notes || ''}\nApproval note: ${body.notes}`.trim();
    }

    // Mark Page status as APPROVED
    const updatedPage = await this.prisma.page.update({
      where: { id },
      data: {
        status: PageStatus.APPROVED,
        notes: updatedNotes,
      },
    });

    // Enqueue asynchronous INDEX_MEMORY job
    await this.prisma.job.create({
      data: {
        type: JobType.INDEX_MEMORY,
        status: JobStatus.QUEUED,
        projectId: page.projectId,
        pageId: id,
        payload: { pageId: id },
      },
    });

    return updatedPage;
  }

  async requestChanges(id: string, note: string, user: any) {
    if (!note || note.trim() === '') {
      throw new BadRequestException('A non-empty note is required to request changes');
    }

    const page = await this.findOne(id);

    const updatedPage = await this.prisma.page.update({
      where: { id },
      data: {
        status: PageStatus.REJECTED,
        notes: `${page.notes || ''}\nChange request note from ${user.name || 'reviewer'}: ${note}`.trim(),
      },
    });

    // Enqueue new TRANSLATE_BATCH job
    await this.prisma.job.create({
      data: {
        type: JobType.TRANSLATE_BATCH,
        status: JobStatus.QUEUED,
        projectId: page.projectId,
        pageId: id,
        payload: { pageId: id, projectId: page.projectId, rejectNote: note },
      },
    });

    return updatedPage;
  }

  async reassignPage(id: string, reviewerIds: string[]) {
    await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      // 1. Delete all existing page reviewers
      await tx.pageReviewer.deleteMany({
        where: { pageId: id },
      });

      // 2. Insert new page reviewers
      if (reviewerIds && reviewerIds.length > 0) {
        for (let i = 0; i < reviewerIds.length; i++) {
          await tx.pageReviewer.create({
            data: {
              pageId: id,
              userId: reviewerIds[i],
              isPrimary: i === 0, // First reviewer is always primary
            },
          });
        }
      }
    });

    // Update assignedAt on Page
    return this.prisma.page.update({
      where: { id },
      data: {
        assignedAt: new Date(),
      },
      include: {
        reviewers: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });
  }

  async addReviewer(id: string, reviewerId: string) {
    await this.findOne(id);

    const existingReviewers = await this.prisma.pageReviewer.findMany({
      where: { pageId: id },
    });

    const alreadyAssigned = existingReviewers.some((r) => r.userId === reviewerId);
    if (!alreadyAssigned) {
      await this.prisma.pageReviewer.create({
        data: {
          pageId: id,
          userId: reviewerId,
          isPrimary: existingReviewers.length === 0,
        },
      });
    }

    return this.findOne(id);
  }

  async removeReviewer(id: string, reviewerId: string) {
    await this.findOne(id);

    const reviewers = await this.prisma.pageReviewer.findMany({
      where: { pageId: id },
    });

    if (reviewers.length === 0) {
      return this.findOne(id);
    }

    if (reviewers.length === 1 && reviewers[0].userId === reviewerId) {
      throw new BadRequestException('Cannot remove the last reviewer. Use reassign instead.');
    }

    const reviewerToRemove = reviewers.find((r) => r.userId === reviewerId);
    if (!reviewerToRemove) {
      return this.findOne(id);
    }

    await this.prisma.pageReviewer.delete({
      where: { id: reviewerToRemove.id },
    });

    // If we removed the primary reviewer, assign a new primary reviewer
    if (reviewerToRemove.isPrimary) {
      const remainingReviewers = reviewers.filter((r) => r.userId !== reviewerId);
      if (remainingReviewers.length > 0) {
        await this.prisma.pageReviewer.update({
          where: { id: remainingReviewers[0].id },
          data: { isPrimary: true },
        });
      }
    }

    return this.findOne(id);
  }

  async escalate(id: string, reason: string, user: any) {
    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Escalation reason is required');
    }

    const page = await this.findOne(id);

    return this.prisma.page.update({
      where: { id },
      data: {
        status: PageStatus.ESCALATED,
        notes: `${page.notes || ''}\nEscalation by ${user.name || 'reviewer'}: ${reason}`.trim(),
      },
    });
  }

  async resolveEscalation(id: string, resolution: string) {
    if (!resolution || resolution.trim() === '') {
      throw new BadRequestException('Resolution is required');
    }

    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        reviewers: true,
      },
    });

    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    // Set page back to HUMAN_REVIEW
    await this.prisma.page.update({
      where: { id },
      data: {
        status: PageStatus.HUMAN_REVIEW,
        notes: `${page.notes || ''}\nEscalation resolved: ${resolution}`.trim(),
      },
    });

    // Re-assign to primary reviewer if still active, otherwise round-robin
    const hasPrimary = page.reviewers.some((r) => r.isPrimary);
    if (!hasPrimary && page.reviewers.length > 0) {
      await this.prisma.pageReviewer.update({
        where: { id: page.reviewers[0].id },
        data: { isPrimary: true },
      });
    }

    return this.findOne(id);
  }

  async nextInQueue(id: string, user: any) {
    const candidatePages = await this.prisma.page.findMany({
      where: {
        status: PageStatus.HUMAN_REVIEW,
        reviewers: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        reviewers: true,
      },
    });

    if (candidatePages.length === 0) {
      return null;
    }

    // Sort by priority weights then assignedAt ascending
    const priorityWeights: Record<Priority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    candidatePages.sort((a, b) => {
      const weightA = priorityWeights[a.priority] || 0;
      const weightB = priorityWeights[b.priority] || 0;

      if (weightA !== weightB) {
        return weightB - weightA; // Descending weight
      }

      const dateA = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
      const dateB = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;

      if (dateA !== dateB) {
        return dateA - dateB; // Ascending date
      }

      return a.pageNumber - b.pageNumber; // Ascending pageNumber
    });

    // Exclude the current page ID to find the next page
    const nextPages = candidatePages.filter((p) => p.id !== id);
    if (nextPages.length > 0) {
      return { pageId: nextPages[0].id };
    }

    return null;
  }
}