import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SentenceStatus, ErrorStatus } from '@prisma/client';

@Injectable()
export class SentencesService {
  constructor(private prisma: PrismaService) {}

  async findByPage(pageId: string) {
    return this.prisma.sentence.findMany({
      where: { pageId },
      orderBy: { sentenceNumber: 'asc' },
      include: {
        errors: true,
      },
    });
  }

  async findOne(id: string) {
    const sentence = await this.prisma.sentence.findUnique({
      where: { id },
      include: { errors: true },
    });
    if (!sentence) {
      throw new NotFoundException(`Sentence with ID ${id} not found`);
    }
    return sentence;
  }

  async update(id: string, data: { translatedText?: string; isApproved?: boolean }, user: any) {
    const sentence = await this.findOne(id);

    // Enforce sentence-level reviewer override lock
    if (
      sentence.assignedReviewerId &&
      sentence.assignedReviewerId !== user.id &&
      user.role !== 'MASTER' &&
      user.role !== 'ADMIN'
    ) {
      throw new ForbiddenException('This sentence is assigned to another reviewer');
    }

    const updateData: any = {};

    if (data.translatedText !== undefined) {
      updateData.translatedText = data.translatedText;
      updateData.status = SentenceStatus.REVIEWED;
      updateData.reviewedAt = new Date();
      updateData.reviewedById = user.id;
    }

    if (data.isApproved !== undefined) {
      updateData.isApproved = data.isApproved;
      if (data.isApproved) {
        updateData.status = SentenceStatus.REVIEWED;
      }
    }

    return this.prisma.sentence.update({
      where: { id },
      data: updateData,
      include: { errors: true },
    });
  }

  async applyAllFixes(id: string, user: any) {
    const sentence = await this.findOne(id);

    // Enforce sentence-level reviewer override lock
    if (
      sentence.assignedReviewerId &&
      sentence.assignedReviewerId !== user.id &&
      user.role !== 'MASTER' &&
      user.role !== 'ADMIN'
    ) {
      throw new ForbiddenException('This sentence is assigned to another reviewer');
    }

    const openErrors = await this.prisma.error.findMany({
      where: { sentenceId: id, status: ErrorStatus.OPEN },
      orderBy: { createdAt: 'asc' },
    });

    if (openErrors.length === 0) {
      return { sentence, errors: [] };
    }

    let currentText = sentence.translatedText || sentence.aiTranslatedText || '';
    const updatedErrors = [];

    for (const error of openErrors) {
      if (!error.currentText || !error.suggestedText) {
        continue;
      }
      currentText = currentText.replace(error.currentText, error.suggestedText);

      const updatedError = await this.prisma.error.update({
        where: { id: error.id },
        data: {
          status: ErrorStatus.APPLIED,
          appliedAt: new Date(),
          appliedById: user.id,
        },
      });
      updatedErrors.push(updatedError);
    }

    const updatedSentence = await this.prisma.sentence.update({
      where: { id },
      data: {
        translatedText: currentText,
        status: SentenceStatus.REVIEWED,
        reviewedAt: new Date(),
        reviewedById: user.id,
      },
      include: { errors: true },
    });

    return { sentence: updatedSentence, errors: updatedErrors };
  }

  async assign(id: string, reviewerId: string | null) {
    await this.findOne(id);

    return this.prisma.sentence.update({
      where: { id },
      data: { assignedReviewerId: reviewerId },
      include: { errors: true },
    });
  }

  async resetTranslation(id: string, user: any) {
    const sentence = await this.findOne(id);

    // Enforce sentence-level reviewer override lock
    if (
      sentence.assignedReviewerId &&
      sentence.assignedReviewerId !== user.id &&
      user.role !== 'MASTER' &&
      user.role !== 'ADMIN'
    ) {
      throw new ForbiddenException('This sentence is assigned to another reviewer');
    }

    if (!sentence.aiTranslatedText) {
      return sentence;
    }

    return this.prisma.sentence.update({
      where: { id },
      data: {
        translatedText: sentence.aiTranslatedText,
        isApproved: false,
        reviewedAt: new Date(),
        reviewedById: user.id,
      },
      include: { errors: true },
    });
  }
}
