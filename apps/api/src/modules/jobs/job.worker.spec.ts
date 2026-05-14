import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobWorker } from './job.worker';
import { JobStatus, JobType } from '@prisma/client';

describe('JobWorker', () => {
  let worker: JobWorker;

  const mockPrisma = {
    job: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  };

  const mockOrchestrator = {
    runProcessDocument: vi.fn(),
    runExtractPage: vi.fn(),
    runDetectChapters: vi.fn(),
    runTranslateBatch: vi.fn(),
    runReviewPage: vi.fn(),
  };

  const mockMemory = {
    indexPage: vi.fn(),
  };

  const mockExport = {
    runExportProject: vi.fn(),
    runExportPageReport: vi.fn(),
    runExportAdminReport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    worker = new JobWorker(
      mockPrisma as any,
      mockOrchestrator as any,
      mockMemory as any,
      mockExport as any,
    );
    // Replace startPolling to be a no-op to prevent infinite background timers
    (worker as any).startPolling = vi.fn();
  });

  describe('onModuleInit and crash recovery', () => {
    it('should recover stuck RUNNING jobs and re-queue them if retryCount < 3', async () => {
      mockPrisma.job.findMany.mockResolvedValue([
        { id: 'j1', type: JobType.TRANSLATE_BATCH, status: JobStatus.RUNNING, retryCount: 1 },
      ]);
      mockPrisma.job.update.mockResolvedValue({ id: 'j1' });

      // Trigger module init directly (calls recoverRunningJobs)
      await worker.onModuleInit();

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith({
        where: { status: JobStatus.RUNNING },
      });
      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: 'j1' },
        data: {
          status: JobStatus.QUEUED,
          retryCount: 2,
          errorMessage: expect.stringContaining('re-queue triggered'),
        },
      });
      expect((worker as any).startPolling).toHaveBeenCalled();
    });

    it('should recover stuck RUNNING jobs and mark them FAILED if retryCount hits maximum', async () => {
      mockPrisma.job.findMany.mockResolvedValue([
        { id: 'j1', type: JobType.TRANSLATE_BATCH, status: JobStatus.RUNNING, retryCount: 2 },
      ]);
      mockPrisma.job.update.mockResolvedValue({ id: 'j1' });

      await worker.onModuleInit();

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: 'j1' },
        data: {
          status: JobStatus.FAILED,
          retryCount: 3,
          errorMessage: expect.stringContaining('Permanently failed'),
          completedAt: expect.any(Date),
        },
      });
    });
  });

  describe('pollAndExecute state machine', () => {
    it('should successfully poll, lock, execute, and mark job as DONE', async () => {
      const mockJob = {
        id: 'job-123',
        type: JobType.TRANSLATE_BATCH,
        status: JobStatus.QUEUED,
        retryCount: 0,
      };

      // Mock transaction behavior
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrisma);
      });
      mockPrisma.$queryRaw.mockResolvedValue([{ id: 'job-123' }]);
      mockPrisma.job.update.mockResolvedValue({ ...mockJob, status: JobStatus.RUNNING });
      mockPrisma.job.findUnique.mockResolvedValue({ ...mockJob, status: JobStatus.RUNNING });

      mockOrchestrator.runTranslateBatch.mockResolvedValue(undefined);

      // Call internal pollAndExecute directly
      await (worker as any).pollAndExecute();

      // Verify that query raw locked the job
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      
      // Verify that orchestrator was called
      expect(mockOrchestrator.runTranslateBatch).toHaveBeenCalledWith('job-123');

      // Verify final job state is DONE
      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        data: {
          status: JobStatus.DONE,
          progress: 100,
          completedAt: expect.any(Date),
        },
      });
    });

    it('should increment retry count if execution throws an error', async () => {
      const mockJob = {
        id: 'job-err',
        type: JobType.TRANSLATE_BATCH,
        status: JobStatus.QUEUED,
        retryCount: 0,
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => callback(mockPrisma));
      mockPrisma.$queryRaw.mockResolvedValue([{ id: 'job-err' }]);
      mockPrisma.job.update.mockResolvedValue({ ...mockJob, status: JobStatus.RUNNING });
      mockPrisma.job.findUnique.mockResolvedValue({ ...mockJob, status: JobStatus.RUNNING });

      mockOrchestrator.runTranslateBatch.mockRejectedValue(new Error('Linguistic pipeline crash'));

      await (worker as any).pollAndExecute();

      // Verify job is re-enqueued
      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: 'job-err' },
        data: {
          status: JobStatus.QUEUED,
          retryCount: 1,
          errorMessage: 'Linguistic pipeline crash',
        },
      });
    });
  });

  describe('onModuleDestroy graceful shutdown', () => {
    it('should complete gracefully by waiting for active in-flight jobs', async () => {
      // Add an active job to set
      (worker as any).activeJobs.add('active-1');

      const destroyPromise = worker.onModuleDestroy();

      // Ensure activeJobs size stays > 0 initially and wait loop runs
      expect((worker as any).shuttingDown).toBe(true);

      // Simulate active job completing in 100ms
      setTimeout(() => {
        (worker as any).activeJobs.delete('active-1');
      }, 100);

      await expect(destroyPromise).resolves.toBeUndefined();
      expect((worker as any).activeJobs.size).toBe(0);
    });
  });
});
