import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewAgent } from '../agents/review.agent';
import {
  PageStatus,
  Priority,
  JobType,
  JobStatus,
  ErrorStatus,
  ErrorSeverity,
} from '@prisma/client';

@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name);

  constructor(
    private prisma: PrismaService,
    private reviewAgent: ReviewAgent,
  ) {}

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
          select: { id: true, name: true, sourceLang: true, targetLang: true, styleGuideId: true },
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

  /**
   * Runs AI review on a single page.
   * Clears old OPEN errors, runs the review agent, creates new Error records with segmentId,
   * calculates quality score, and transitions page to HUMAN_REVIEW.
   */
  async reviewPage(id: string, user: any, modelOverride?: string) {
    const page = await this.findOne(id);

    if (!page.translatedHtml) {
      throw new BadRequestException('Page has not been translated yet. Run translation first.');
    }

    const { errors, modelUsed } = await this.reviewAgent.reviewPage(
      page.projectId,
      page.id,
      page.originalHtml || '',
      page.translatedHtml,
      modelOverride,
    );

    await this.prisma.error.deleteMany({
      where: { pageId: id, status: ErrorStatus.OPEN },
    });

    for (const err of errors) {
      await this.prisma.error.create({
        data: {
          pageId: id,
          segmentId: err.segmentId || null,
          severity: err.severity,
          category: err.category,
          location: err.location,
          currentText: err.currentText,
          suggestedText: err.suggestedText,
          issueDescription: err.issueDescription,
          reference: err.reference,
          aiNote: err.aiNote,
        },
      });
    }

    let criticalCount = 0, highCount = 0, medCount = 0, lowCount = 0;
    let worstSeverity: ErrorSeverity | null = null;

    for (const err of errors) {
      if (err.severity === ErrorSeverity.CRITICAL) {
        criticalCount++;
        worstSeverity = ErrorSeverity.CRITICAL;
      } else if (err.severity === ErrorSeverity.HIGH) {
        highCount++;
        if (worstSeverity !== ErrorSeverity.CRITICAL) worstSeverity = ErrorSeverity.HIGH;
      } else if (err.severity === ErrorSeverity.MEDIUM) {
        medCount++;
        if (worstSeverity !== ErrorSeverity.CRITICAL && worstSeverity !== ErrorSeverity.HIGH) worstSeverity = ErrorSeverity.MEDIUM;
      } else if (err.severity === ErrorSeverity.LOW) {
        lowCount++;
        if (!worstSeverity) worstSeverity = ErrorSeverity.LOW;
      }
    }

    const pageQuality = Math.max(0, Math.round(100 - (criticalCount * 5 + highCount * 2 + medCount * 1 + lowCount * 0.5)));

    let priority: Priority = Priority.MEDIUM;
    if (worstSeverity === ErrorSeverity.CRITICAL) priority = Priority.CRITICAL;
    else if (worstSeverity === ErrorSeverity.HIGH) priority = Priority.HIGH;
    else if (worstSeverity === ErrorSeverity.MEDIUM) priority = Priority.MEDIUM;
    else if (worstSeverity === ErrorSeverity.LOW) priority = Priority.LOW;

    const reviewers = await this.prisma.user.findMany({
      where: { role: 'REVIEWER', isActive: true },
    });

    if (reviewers.length > 0) {
      let bestReviewerId = reviewers[0].id;
      let lowestCount = Infinity;

      for (const rev of reviewers) {
        const count = await this.prisma.pageReviewer.count({
          where: {
            userId: rev.id,
            page: { status: PageStatus.HUMAN_REVIEW },
          },
        });
        if (count < lowestCount) {
          lowestCount = count;
          bestReviewerId = rev.id;
        }
      }

      await this.prisma.pageReviewer.upsert({
        where: { pageId_userId: { pageId: page.id, userId: bestReviewerId } },
        create: { pageId: page.id, userId: bestReviewerId, isPrimary: true },
        update: { isPrimary: true },
      });
    }

    const updatedPage = await this.prisma.page.update({
      where: { id },
      data: {
        status: PageStatus.HUMAN_REVIEW,
        quality: pageQuality,
        priority,
        assignedAt: new Date(),
        lastAiRunAt: new Date(),
        reviewModel: modelUsed,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'page.reviewed',
        entityType: 'page',
        entityId: id,
        entityHref: `/projects/${page.projectId}`,
        details: { pageNumber: page.pageNumber, projectName: page.project?.name, errorCount: errors.length, quality: pageQuality },
      },
    });

    return {
      pageId: id,
      status: updatedPage.status,
      quality: pageQuality,
      priority,
      errorCount: errors.length,
      modelUsed,
      errors: errors.map((e) => ({ segmentId: e.segmentId, severity: e.severity, category: e.category, issueDescription: e.issueDescription })),
    };
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
        this.logger.warn(`Approval blocked for page ${id}: ${openErrorsCount} open errors`);
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

    // If every page in the project is now approved, mark the project COMPLETED
    const [total, approved] = await Promise.all([
      this.prisma.page.count({ where: { projectId: page.projectId } }),
      this.prisma.page.count({ where: { projectId: page.projectId, status: PageStatus.APPROVED } }),
    ]);
    if (total > 0 && approved === total) {
      await this.prisma.project.update({
        where: { id: page.projectId },
        data: { status: 'COMPLETED' },
      });
      this.logger.log(`Project ${page.projectId}: all pages approved → COMPLETED`);
    }

    this.logger.log(`Page approved: ${id} by user ${user.id} (${user.role})`);
    return updatedPage;
  }

  async submitForReview(id: string, user: any) {
    const page = await this.findOne(id);
    if (page.status !== PageStatus.HUMAN_REVIEW) {
      throw new BadRequestException('Page must be in HUMAN_REVIEW status to submit for master review');
    }
    const updated = await this.prisma.page.update({
      where: { id },
      data: { submittedAt: new Date(), submittedById: user.id },
    });
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'page.submitted_for_review',
        entityType: 'page',
        entityId: id,
        entityHref: `/workbench/${id}`,
        details: { pageNumber: page.pageNumber },
      },
    });
    return updated;
  }

  async unsubmit(id: string, user: any) {
    await this.findOne(id);
    return this.prisma.page.update({
      where: { id },
      data: { submittedAt: null, submittedById: null },
    });
  }

  async requestChanges(id: string, note: string, user: any) {
    if (!note || note.trim() === '') {
      throw new BadRequestException('A non-empty note is required to request changes');
    }

    const page = await this.findOne(id);

    if (page.retryCount >= page.maxRetries) {
      this.logger.warn(`Page ${id} exceeded max retries (${page.maxRetries})`);
      throw new UnprocessableEntityException({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: `Page has reached the maximum retry limit of ${page.maxRetries}. A MASTER or ADMIN must override via POST /admin/pages/:id/override.`,
        code: 'MAX_RETRIES_EXCEEDED',
      });
    }

    const updatedPage = await this.prisma.page.update({
      where: { id },
      data: {
        status: PageStatus.REJECTED,
        retryCount: page.retryCount + 1,
        notes: `${page.notes || ''}\nChange request note from ${user.name || 'reviewer'}: ${note}`.trim(),
      },
    });

    // Enqueue new TRANSLATE_BATCH job with correct pageIds array payload
    await this.prisma.job.create({
      data: {
        type: JobType.TRANSLATE_BATCH,
        status: JobStatus.QUEUED,
        projectId: page.projectId,
        pageId: id,
        payload: { projectId: page.projectId, pageIds: [id] },
      },
    });

    this.logger.log(`Changes requested for page ${id} (retry ${updatedPage.retryCount}/${page.maxRetries}) by user ${user.id}`);
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

  async bulkAssign(pageIds: string[], reviewerId: string) {
    const results = [];
    for (const pageId of pageIds) {
      const existing = await this.prisma.pageReviewer.findFirst({ where: { pageId, userId: reviewerId } });
      if (!existing) {
        const count = await this.prisma.pageReviewer.count({ where: { pageId } });
        await this.prisma.pageReviewer.create({ data: { pageId, userId: reviewerId, isPrimary: count === 0 } });
      }
      results.push(pageId);
    }
    return { assigned: results.length };
  }

  async bulkUnassign(pageIds: string[], reviewerId: string) {
    for (const pageId of pageIds) {
      const reviewers = await this.prisma.pageReviewer.findMany({ where: { pageId } });
      const entry = reviewers.find(r => r.userId === reviewerId);
      if (!entry) continue;
      if (reviewers.length === 1) continue; // don't remove last reviewer
      await this.prisma.pageReviewer.delete({ where: { id: entry.id } });
      if (entry.isPrimary) {
        const remaining = reviewers.filter(r => r.userId !== reviewerId);
        if (remaining.length > 0) {
          await this.prisma.pageReviewer.update({ where: { id: remaining[0].id }, data: { isPrimary: true } });
        }
      }
    }
    return { unassigned: pageIds.length };
  }

  async bulkReassign(pageIds: string[], reviewerIds: string[]) {
    for (const pageId of pageIds) {
      await this.prisma.$transaction(async (tx) => {
        await tx.pageReviewer.deleteMany({ where: { pageId } });
        for (let i = 0; i < reviewerIds.length; i++) {
          await tx.pageReviewer.create({ data: { pageId, userId: reviewerIds[i], isPrimary: i === 0 } });
        }
      });
      await this.prisma.page.update({ where: { id: pageId }, data: { assignedAt: new Date() } });
    }
    return { reassigned: pageIds.length };
  }

  async escalate(id: string, reason: string, user: any) {
    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Escalation reason is required');
    }

    const page = await this.findOne(id);

    const result = await this.prisma.page.update({
      where: { id },
      data: {
        status: PageStatus.HUMAN_REVIEW,
        notes: `${page.notes || ''}\nEscalation by ${user.name || 'reviewer'}: ${reason}`.trim(),
      },
    });
    this.logger.warn(`Page escalated: ${id} by user ${user.id}`);
    return result;
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

    this.logger.log(`Escalation resolved for page ${id}`);
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

  // ── Workbench helpers ────────────────────────────────────────────────

  async getSiblings(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { project: { select: { id: true } } },
    });
    if (!page) throw new NotFoundException('Page not found');

    const siblings = await this.prisma.page.findMany({
      where: { projectId: page.projectId },
      orderBy: { pageNumber: 'asc' },
      select: { id: true, pageNumber: true },
    });

    const idx = siblings.findIndex((p) => p.id === id);
    const prev = idx > 0 ? siblings[idx - 1] : null;
    const next = idx < siblings.length - 1 ? siblings[idx + 1] : null;

    return {
      prevPageId: prev?.id ?? null,
      prevPageNumber: prev?.pageNumber ?? null,
      nextPageId: next?.id ?? null,
      nextPageNumber: next?.pageNumber ?? null,
      currentPageNumber: page.pageNumber,
    };
  }

  async replaceImage(id: string) {
    return this.prisma.page.findUniqueOrThrow({ where: { id } });
  }

  async retranslatePage(id: string, modelOverride: string | undefined, user: any) {
    return this.prisma.page.update({
      where: { id },
      data: { status: PageStatus.TRANSLATING, errorMessage: null },
    });
  }

  async getEdits(id: string) {
    return this.prisma.pageEdit.findMany({
      where: { pageId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        segmentId: true,
        editedText: true,
        editedById: true,
        createdAt: true,
      },
    });
  }

  async saveEdit(pageId: string, segmentId: string, editedText: string, user: any) {
    return this.prisma.pageEdit.upsert({
      where: { pageId_segmentId: { pageId, segmentId } },
      create: { pageId, segmentId, editedText, editedById: user.id },
      update: { editedText },
    });
  }

  async resetEdit(pageId: string, segmentId: string) {
    await this.prisma.pageEdit.delete({
      where: { pageId_segmentId: { pageId, segmentId } },
    });
  }

  async resetAllEdits(pageId: string) {
    const deleted = await this.prisma.pageEdit.deleteMany({ where: { pageId } });
    return { deletedCount: deleted.count };
  }

  async retranslateSegment(
    pageId: string,
    segmentId: string,
    prompt: string | undefined,
    modelOverride: string | undefined,
    user: any,
  ) {
    throw new Error('Segment retranslation not implemented yet');
  }
}