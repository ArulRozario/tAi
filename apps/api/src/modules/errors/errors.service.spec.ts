import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorsService } from './errors.service';
import { ErrorStatus, ErrorSeverity, ErrorCategory, PageStatus } from '@prisma/client';

describe('ErrorsService', () => {
  let service: ErrorsService;

  const mockPrisma = {
    error: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    page: {
      update: vi.fn(),
    },
    glossaryTerm: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ErrorsService(mockPrisma as any);
  });

  describe('apply', () => {
    it('should successfully apply error correction, update translatedHtml, and recalculate score', async () => {
      const mockError = {
        id: 'e-1',
        pageId: 'page-123',
        status: ErrorStatus.OPEN,
        currentText: 'Word',
        suggestedText: 'வார்த்தை',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.TERMINOLOGY,
        page: {
          id: 'page-123',
          translatedHtml: 'In the beginning was the Word',
        },
      };

      mockPrisma.error.findUnique.mockResolvedValue(mockError);
      mockPrisma.error.findMany.mockResolvedValue([]); // Remaining open errors
      mockPrisma.$transaction.mockImplementation(async (promises) => promises);
      mockPrisma.error.update.mockResolvedValue({ ...mockError, status: ErrorStatus.APPLIED });
      mockPrisma.page.update.mockResolvedValue({ id: 'page-123', quality: 100 });

      await service.apply('e-1', { id: 'u-1' });

      expect(mockPrisma.error.update).toHaveBeenCalledWith({
        where: { id: 'e-1' },
        data: {
          status: ErrorStatus.APPLIED,
          appliedAt: expect.any(Date),
          appliedById: 'u-1',
        },
      });

      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: 'page-123' },
        data: {
          translatedHtml: 'In the beginning was the வார்த்தை',
          status: PageStatus.HUMAN_REVIEW,
          quality: 100,
        },
        include: { errors: true },
      });
    });
  });

  describe('exception', () => {
    it('should transition error to EXCEPTION status and seed GlossaryTerm if sourceTerm is provided', async () => {
      const mockError = {
        id: 'e-2',
        pageId: 'page-123',
        status: ErrorStatus.OPEN,
        currentText: 'வார்த்தை',
        suggestedText: 'பதம்',
        aiNote: 'Style issue',
        page: {
          id: 'page-123',
          project: {
            styleGuideId: 'genre-abc',
          },
        },
      };

      mockPrisma.error.findUnique.mockResolvedValue(mockError);
      mockPrisma.error.findMany.mockResolvedValue([]);
      mockPrisma.error.update.mockResolvedValue({ ...mockError, status: ErrorStatus.EXCEPTION });
      mockPrisma.page.update.mockResolvedValue({ id: 'page-123' });
      mockPrisma.glossaryTerm.upsert.mockResolvedValue({ id: 'gt-1' });

      const result = await service.exception('e-2', {
        sourceTerm: 'Word',
        note: 'Theologians accept this alternate Tamil rendering.',
      });

      // Verify status transition
      expect(mockPrisma.error.update).toHaveBeenCalledWith({
        where: { id: 'e-2' },
        data: {
          status: ErrorStatus.EXCEPTION,
          aiNote: expect.stringContaining('Theologians accept this alternate'),
        },
      });

      // Verify automated GlossaryTerm creation
      expect(mockPrisma.glossaryTerm.upsert).toHaveBeenCalledWith({
        where: {
          styleGuideId_sourceTerm: {
            styleGuideId: 'genre-abc',
            sourceTerm: 'Word',
          },
        },
        update: {
          targetTerm: 'வார்த்தை', // Maps to error.currentText
          notes: 'Theologians accept this alternate Tamil rendering.',
        },
        create: {
          styleGuideId: 'genre-abc',
          sourceTerm: 'Word',
          targetTerm: 'வார்த்தை',
          notes: 'Theologians accept this alternate Tamil rendering.',
        },
      });

      expect(result.glossaryTerm).toBeDefined();
    });
  });
});
