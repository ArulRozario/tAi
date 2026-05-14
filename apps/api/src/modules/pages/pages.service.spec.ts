import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PagesService } from './pages.service';
import { PageStatus, ErrorStatus, JobType, JobStatus } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

describe('PagesService', () => {
  let service: PagesService;

  const mockPrisma = {
    page: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    error: {
      count: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
    job: {
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PagesService(mockPrisma as any, {} as any);
  });

  describe('approve', () => {
    it('should block approval for normal REVIEWER if there are OPEN errors', async () => {
      const mockPage = {
        id: 'page-123',
        projectId: 'project-1',
        pageNumber: 2,
        notes: 'Some notes',
      };

      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.error.count.mockResolvedValue(3); // 3 OPEN errors

      const user = { id: 'u-1', role: 'REVIEWER' };

      await expect(service.approve('page-123', {}, user)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockPrisma.error.count).toHaveBeenCalledWith({
        where: { pageId: 'page-123', status: ErrorStatus.OPEN },
      });
      expect(mockPrisma.page.update).not.toHaveBeenCalled();
    });

    it('should allow approval for MASTER even if there are OPEN errors', async () => {
      const mockPage = {
        id: 'page-123',
        projectId: 'project-1',
        pageNumber: 2,
        notes: 'Some notes',
      };

      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.error.count.mockResolvedValue(3); // Should be ignored for master
      mockPrisma.page.update.mockResolvedValue({ ...mockPage, status: PageStatus.APPROVED });
      mockPrisma.activityLog.create.mockResolvedValue({});
      mockPrisma.job.create.mockResolvedValue({});

      const user = { id: 'u-master', role: 'MASTER' };

      const result = await service.approve('page-123', { notes: 'Master override approval' }, user);

      expect(result.status).toBe(PageStatus.APPROVED);
      expect(mockPrisma.page.update).toHaveBeenCalledWith({
        where: { id: 'page-123' },
        data: {
          status: PageStatus.APPROVED,
          notes: 'Some notes\nApproval note: Master override approval',
        },
      });

      // Verify that INDEX_MEMORY job was enqueued
      expect(mockPrisma.job.create).toHaveBeenCalledWith({
        data: {
          type: JobType.INDEX_MEMORY,
          status: JobStatus.QUEUED,
          projectId: 'project-1',
          pageId: 'page-123',
          payload: { pageId: 'page-123' },
        },
      });
    });

    it('should allow approval for normal REVIEWER if there are no OPEN errors', async () => {
      const mockPage = {
        id: 'page-123',
        projectId: 'project-1',
        pageNumber: 2,
        notes: 'Some notes',
      };

      mockPrisma.page.findUnique.mockResolvedValue(mockPage);
      mockPrisma.error.count.mockResolvedValue(0); // No open errors
      mockPrisma.page.update.mockResolvedValue({ ...mockPage, status: PageStatus.APPROVED });
      mockPrisma.activityLog.create.mockResolvedValue({});
      mockPrisma.job.create.mockResolvedValue({});

      const user = { id: 'u-1', role: 'REVIEWER' };

      const result = await service.approve('page-123', { notes: 'Clean review' }, user);

      expect(result.status).toBe(PageStatus.APPROVED);
      expect(mockPrisma.page.update).toHaveBeenCalled();
    });
  });
});
