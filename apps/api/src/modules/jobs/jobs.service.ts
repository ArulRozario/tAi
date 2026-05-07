import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobType, JobStatus, Job } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enqueues a new asynchronous background job.
   */
  async enqueue(data: {
    type: JobType;
    projectId?: string;
    pageId?: string;
    payload?: any;
    parentJobId?: string;
  }): Promise<Job> {
    let projectId = data.projectId;
    const pageId = data.pageId;

    // Auto-propagate projectId from page relation if missing
    if (pageId && !projectId) {
      const page = await this.prisma.page.findUnique({
        where: { id: pageId },
      });
      if (page) {
        projectId = page.projectId;
      }
    }

    return this.prisma.job.create({
      data: {
        type: data.type,
        status: JobStatus.QUEUED,
        payload: data.payload || {},
        projectId,
        pageId,
        parentJobId: data.parentJobId,
      },
    });
  }

  /**
   * Retrieves a single job by ID.
   */
  async get(id: string): Promise<Job> {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID '${id}' not found.`);
    }

    return job;
  }

  /**
   * Cascadingly cancels a job and all its descendant jobs.
   */
  async cancel(id: string): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID '${id}' not found.`);
    }

    // Cancel parent job
    await this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.CANCELLED,
        completedAt: new Date(),
      },
    });

    // Cascadingly cancel all uncompleted child jobs recursively
    const children = await this.prisma.job.findMany({
      where: { parentJobId: id },
    });

    for (const child of children) {
      if (
        child.status === JobStatus.QUEUED ||
        child.status === JobStatus.RUNNING ||
        child.status === JobStatus.PAUSED
      ) {
        await this.cancel(child.id);
      }
    }
  }
}
