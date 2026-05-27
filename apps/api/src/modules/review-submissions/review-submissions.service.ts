import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewSubmissionStatus, PageStatus, JobType, JobStatus } from '@prisma/client';

@Injectable()
export class ReviewSubmissionsService {
  private readonly logger = new Logger(ReviewSubmissionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Submit a reviewer's working PageEdits as a new submission.
   * Only one PENDING submission per reviewer per page is allowed.
   */
  async submit(pageId: string, user: any, notes?: string) {
    // Verify page exists
    const page = await this.prisma.page.findUnique({ where: { id: pageId } });
    if (!page) throw new NotFoundException(`Page ${pageId} not found`);

    // Find working edits for this reviewer on this page
    const workingEdits = await this.prisma.pageEdit.findMany({
      where: { pageId, editedById: user.id },
    });

    if (workingEdits.length === 0) {
      throw new BadRequestException('No working edits to submit. Make some segment corrections first.');
    }

    // Transaction: create submission + items + delete working edits + update page
    // PENDING uniqueness check is inside the transaction to prevent double-submit races
    const result = await this.prisma.$transaction(async (tx) => {
      const existingPending = await tx.pageReviewSubmission.findFirst({
        where: { pageId, submittedById: user.id, status: ReviewSubmissionStatus.PENDING },
      });

      if (existingPending) {
        throw new BadRequestException(
          `You already have a pending submission (${existingPending.id}). Unsubmit it first or wait for master review.`
        );
      }

      const submission = await tx.pageReviewSubmission.create({
        data: {
          pageId,
          submittedById: user.id,
          notes: notes?.trim() || null,
          status: ReviewSubmissionStatus.PENDING,
        },
      });

      await tx.pageReviewSubmissionItem.createMany({
        data: workingEdits.map((edit) => ({
          submissionId: submission.id,
          segmentId: edit.segmentId,
          editedText: edit.editedText,
        })),
      });

      await tx.pageEdit.deleteMany({
        where: { pageId, editedById: user.id },
      });

      const updatedPage = await tx.page.update({
        where: { id: pageId },
        data: {
          submittedAt: new Date(),
          submittedById: user.id,
        },
      });

      return { submission, updatedPage };
    });

    this.logger.log(
      `PageReviewSubmission created: ${result.submission.id} by user ${user.id} for page ${pageId} with ${workingEdits.length} items`
    );

    return this.findOne(result.submission.id);
  }

  /**
   * List all submissions for a page.
   * Reviewers see only their own; masters/admins see all.
   */
  async findByPage(pageId: string, user: any, status?: string) {
    const page = await this.prisma.page.findUnique({ where: { id: pageId } });
    if (!page) throw new NotFoundException(`Page ${pageId} not found`);

    const where: any = { pageId };
    if (status) {
      where.status = status.toUpperCase() as ReviewSubmissionStatus;
    }

    // If reviewer, restrict to their own submissions unless they are also master/admin
    if (user.role === 'REVIEWER') {
      where.submittedById = user.id;
    }

    const submissions = await this.prisma.pageReviewSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: { select: { items: true } },
      },
    });

    return {
      data: submissions.map((s) => ({
        ...s,
        itemCount: s._count.items,
        _count: undefined,
      })),
    };
  }

  /**
   * Get a single submission by ID with items.
   */
  async findOne(id: string) {
    const submission = await this.prisma.pageReviewSubmission.findUnique({
      where: { id },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        items: true,
      },
    });

    if (!submission) throw new NotFoundException(`Submission ${id} not found`);
    return submission;
  }

  /**
   * Get all corrections for a specific segment across all submissions on a page.
   * Masters/admins see all; reviewers see only their own.
   */
  async findBySegment(pageId: string, segmentId: string, user: any) {
    const page = await this.prisma.page.findUnique({ where: { id: pageId } });
    if (!page) throw new NotFoundException(`Page ${pageId} not found`);

    const where: any = {
      submission: { pageId },
      segmentId,
    };

    if (user.role === 'REVIEWER') {
      where.submission = { ...where.submission, submittedById: user.id };
    }

    const items = await this.prisma.pageReviewSubmissionItem.findMany({
      where,
      include: {
        submission: {
          select: {
            id: true,
            status: true,
            submittedBy: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: items.map((item) => ({
        submissionId: item.submission.id,
        status: item.submission.status,
        submittedBy: item.submission.submittedBy,
        editedText: item.editedText,
        createdAt: item.submission.createdAt,
      })),
    };
  }

  /**
   * Approve a submission. This becomes the canonical version for the page.
   */
  async approve(pageId: string, submissionId: string, user: any, notes?: string) {
    const page = await this.prisma.page.findUnique({ where: { id: pageId } });
    if (!page) throw new NotFoundException(`Page ${pageId} not found`);

    const submission = await this.prisma.pageReviewSubmission.findUnique({
      where: { id: submissionId },
      include: { items: true },
    });

    if (!submission) throw new NotFoundException(`Submission ${submissionId} not found`);
    if (submission.pageId !== pageId) {
      throw new BadRequestException('Submission does not belong to this page');
    }
    if (submission.status !== ReviewSubmissionStatus.PENDING) {
      throw new BadRequestException(`Cannot approve a submission with status ${submission.status}`);
    }

    // Transaction: apply approved submission
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Delete all existing working edits for this page
      await tx.pageEdit.deleteMany({ where: { pageId } });

      // 2. Create new PageEdit records from submission items
      // Preserve original reviewer attribution via editedById
      if (submission.items.length > 0) {
        await tx.pageEdit.createMany({
          data: submission.items.map((item) => ({
            pageId,
            segmentId: item.segmentId,
            editedText: item.editedText,
            editedById: submission.submittedById,
          })),
        });
      }

      // 3. Approve this submission
      const updatedSubmission = await tx.pageReviewSubmission.update({
        where: { id: submissionId },
        data: { status: ReviewSubmissionStatus.APPROVED },
      });

      // 4. Reject all other PENDING submissions for this page
      await tx.pageReviewSubmission.updateMany({
        where: {
          pageId,
          id: { not: submissionId },
          status: ReviewSubmissionStatus.PENDING,
        },
        data: {
          status: ReviewSubmissionStatus.REJECTED,
          rejectedAt: new Date(),
          rejectedById: user.id,
          rejectionReason: 'Another submission was approved by master',
        },
      });

      // 5. Update page with approved submission reference
      let updatedNotes = page.notes;
      if (notes) {
        updatedNotes = `${page.notes || ''}\nMaster approval note: ${notes}`.trim();
      }

      const updatedPage = await tx.page.update({
        where: { id: pageId },
        data: {
          approvedSubmissionId: submissionId,
          status: PageStatus.HUMAN_REVIEW,
          notes: updatedNotes,
        },
      });

      // 6. Log activity
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: 'page.review_submission_approved',
          entityType: 'page',
          entityId: pageId,
          entityHref: `/workbench/${pageId}`,
          details: {
            submissionId,
            submittedById: submission.submittedById,
            itemCount: submission.items.length,
            masterNote: notes,
          },
        },
      });

      return { submission: updatedSubmission, page: updatedPage };
    });

    this.logger.log(
      `Submission ${submissionId} approved by user ${user.id} for page ${pageId}. Applied ${submission.items.length} edits.`
    );

    return this.findOne(submissionId);
  }

  /**
   * Reject a submission.
   */
  async reject(pageId: string, submissionId: string, user: any, reason?: string) {
    const page = await this.prisma.page.findUnique({ where: { id: pageId } });
    if (!page) throw new NotFoundException(`Page ${pageId} not found`);

    const submission = await this.prisma.pageReviewSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) throw new NotFoundException(`Submission ${submissionId} not found`);
    if (submission.pageId !== pageId) {
      throw new BadRequestException('Submission does not belong to this page');
    }
    if (submission.status !== ReviewSubmissionStatus.PENDING) {
      throw new BadRequestException(`Cannot reject a submission with status ${submission.status}`);
    }

    const updated = await this.prisma.pageReviewSubmission.update({
      where: { id: submissionId },
      data: {
        status: ReviewSubmissionStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedById: user.id,
        rejectionReason: reason?.trim() || null,
      },
    });

    this.logger.log(`Submission ${submissionId} rejected by user ${user.id} for page ${pageId}`);

    return updated;
  }

  /**
   * Unsubmit (withdraw) a pending submission.
   * Restores working edits so the reviewer can keep editing.
   */
  async unsubmit(pageId: string, submissionId: string, user: any) {
    const page = await this.prisma.page.findUnique({ where: { id: pageId } });
    if (!page) throw new NotFoundException(`Page ${pageId} not found`);

    const submission = await this.prisma.pageReviewSubmission.findUnique({
      where: { id: submissionId },
      include: { items: true },
    });

    if (!submission) throw new NotFoundException(`Submission ${submissionId} not found`);
    if (submission.pageId !== pageId) {
      throw new BadRequestException('Submission does not belong to this page');
    }
    if (submission.status !== ReviewSubmissionStatus.PENDING) {
      throw new BadRequestException(`Cannot unsubmit a submission with status ${submission.status}`);
    }

    // Only the submitter or master/admin can unsubmit
    if (submission.submittedById !== user.id && user.role !== 'MASTER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only unsubmit your own submissions');
    }

    await this.prisma.$transaction(async (tx) => {
      // Restore working edits from submission items.
      // Pre-delete any conflicting edits for the same segments to satisfy the (pageId, segmentId) unique constraint.
      if (submission.items.length > 0) {
        await tx.pageEdit.deleteMany({
          where: {
            pageId,
            segmentId: { in: submission.items.map((i) => i.segmentId) },
          },
        });

        await tx.pageEdit.createMany({
          data: submission.items.map((item) => ({
            pageId,
            segmentId: item.segmentId,
            editedText: item.editedText,
            editedById: submission.submittedById,
          })),
        });
      }

      // Delete submission (cascade deletes items)
      await tx.pageReviewSubmission.delete({ where: { id: submissionId } });

      // Clear page submittedAt if no other submissions remain
      const remainingSubmissions = await tx.pageReviewSubmission.count({
        where: { pageId },
      });

      if (remainingSubmissions === 0) {
        await tx.page.update({
          where: { id: pageId },
          data: { submittedAt: null, submittedById: null },
        });
      }
    });

    this.logger.log(`Submission ${submissionId} unsubmitted by user ${user.id} for page ${pageId}`);

    return { message: 'Submission withdrawn and working edits restored' };
  }

  /**
   * Count pending submissions for a page.
   */
  async countPending(pageId: string) {
    return this.prisma.pageReviewSubmission.count({
      where: { pageId, status: ReviewSubmissionStatus.PENDING },
    });
  }
}
