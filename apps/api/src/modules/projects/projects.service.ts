import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { JobsService } from '../jobs/jobs.service';
import { JobType, ProjectStatus, JobStatus, PageStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
  ) {}

  async create(ownerId: string, createProjectDto: CreateProjectDto) {
    const styleGuide = await this.prisma.styleGuide.findUnique({
      where: { id: createProjectDto.styleGuideId },
    });

    if (!styleGuide) {
      throw new NotFoundException(`StyleGuide with ID '${createProjectDto.styleGuideId}' not found.`);
    }

    let project;
    try {
      project = await this.prisma.project.create({
        data: {
          name: createProjectDto.name,
          description: createProjectDto.description,
          sourceLang: createProjectDto.sourceLang,
          targetLang: createProjectDto.targetLang,
          styleGuideId: createProjectDto.styleGuideId,
          ownerId,
          status: ProjectStatus.DRAFT,
          sourceFileId: createProjectDto.sourceFileId,
        },
        include: {
          styleGuide: true,
          owner: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        }
      });
    } catch (err: any) {
      // P2003 = foreign key violation; most likely the JWT user no longer exists in the DB
      if (err?.code === 'P2003' && err?.meta?.field_name?.includes('ownerId')) {
        throw new UnauthorizedException('Your session is invalid or expired. Please log out and log back in.');
      }
      throw err;
    }

    // 3. Atomically enqueue SPLIT_DOCUMENT job if sourceFileId is provided
    if (createProjectDto.sourceFileId) {
      try {
        await this.jobsService.enqueue({
          type: JobType.SPLIT_DOCUMENT,
          projectId: project.id,
          payload: {
            projectId: project.id,
            sourceFileId: createProjectDto.sourceFileId,
          },
        });

        // Set project status to PROCESSING
        this.logger.log(`Project created: ${project.id} "${project.name}" (${project.sourceLang}→${project.targetLang}), status→PROCESSING`);
        return await this.prisma.project.update({
          where: { id: project.id },
          data: { status: ProjectStatus.PROCESSING },
          include: {
            styleGuide: true,
            owner: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          }
        });
      } catch (err) {
        // Rollback project creation to maintain strict atomicity
        await this.prisma.project.delete({
          where: { id: project.id },
        });
        throw err;
      }
    }

    this.logger.log(`Project created: ${project.id} "${project.name}" (DRAFT, no source file)`);
    return project;
  }

  /**
   * Retrieves all projects, ordered newest first.
   */
  async findAll(page = 1, limit = 20, assignedToUserId?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (assignedToUserId) {
      where.pages = { some: { reviewers: { some: { userId: assignedToUserId } } } };
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          styleGuide: {
            select: { id: true, name: true },
          },
          collection: {
            select: { id: true, name: true, icon: true, color: true, parentId: true },
          },
          _count: {
            select: { pages: true },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves a single project detail by ID.
   */
  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        styleGuide: {
          select: { id: true, name: true },
        },
        collection: {
          select: { id: true, name: true, icon: true, color: true, parentId: true },
        },
        pages: {
          orderBy: { pageNumber: 'asc' },
          select: {
            id: true,
            pageNumber: true,
            status: true,
            quality: true,
            submittedAt: true,
            reviewers: {
              select: {
                id: true,
                userId: true,
                isPrimary: true,
                assignedAt: true,
                user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
              },
            },
          },
        },
        _count: {
          select: { pages: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${id}' not found.`);
    }

    return project;
  }

  /**
   * Modifies an existing project's metadata or status.
   */
  async update(id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id); // Ensure exists first

    return this.prisma.project.update({
      where: { id },
      data: {
        ...(updateProjectDto.name !== undefined && { name: updateProjectDto.name }),
        ...(updateProjectDto.description !== undefined && { description: updateProjectDto.description }),
        ...(updateProjectDto.status !== undefined && { status: updateProjectDto.status }),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        styleGuide: {
          select: { id: true, name: true },
        },
      }
    });
  }

  /**
   * Removes a project.
   */
  async remove(id: string) {
    await this.findOne(id); // Ensure exists first

    await this.prisma.project.delete({
      where: { id },
    });

    this.logger.warn(`Project deleted: ${id}`);
    return { success: true };
  }

  /**
   * Retrieves all chapters associated with a project.
   * Ordered by chapter number.
   */
  async findAllChapters(projectId: string) {
    await this.findOne(projectId); // Ensure project exists

    return this.prisma.chapter.findMany({
      where: { projectId },
      orderBy: { number: 'asc' },
    });
  }

  /**
   * Creates a new chapter under a specific project.
   * Enforces uniqueness on [projectId, chapterNumber] key combinations.
   */
  async createChapter(projectId: string, chapterNumber: number, title?: string) {
    await this.findOne(projectId); // Ensure project exists

    // 1. Check for duplicate chapter number within this specific project
    const existingChapter = await this.prisma.chapter.findUnique({
      where: {
        projectId_number: {
          projectId,
          number: chapterNumber,
        }
      }
    });

    if (existingChapter) {
      throw new ConflictException(`Chapter number ${chapterNumber} is already registered in this project.`);
    }

    // 2. Persist the chapter record
    return this.prisma.chapter.create({
      data: {
        projectId,
        number: chapterNumber,
        title: title || null,
      }
    });
  }

  /**
   * Retrieves all glossary cards/terms associated with a project.
   * Dynamically resolves the terms via the project's linked StyleGuide.
   */
  async findGlossaryTerms(projectId: string) {
    const project = await this.findOne(projectId); // Ensure project exists and retrieve metadata

    return this.prisma.glossaryTerm.findMany({
      where: { styleGuideId: project.styleGuideId },
      orderBy: { sourceTerm: 'asc' },
    });
  }

  /**
   * Aggregates stats about all pages currently attached to a project.
   */
  async getStats(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        pages: {
          select: { status: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${id}' not found.`);
    }

    const counts: Record<string, number> = {};
    for (const page of project.pages) {
      counts[page.status] = (counts[page.status] ?? 0) + 1;
    }

    const g = (s: PageStatus) => counts[s] ?? 0;

    return {
      total: project.pages.length,
      pending: g(PageStatus.PENDING),
      rendering: g(PageStatus.RENDERING),
      ready: g(PageStatus.READY),
      translating: g(PageStatus.TRANSLATING),
      translated: g(PageStatus.TRANSLATED),
      reviewing: g(PageStatus.REVIEWING),
      humanReview: g(PageStatus.HUMAN_REVIEW),
      approved: g(PageStatus.APPROVED),
      rejected: g(PageStatus.REJECTED),
      renderError: g(PageStatus.RENDER_ERROR),
      translationError: g(PageStatus.TRANSLATION_ERROR),
    };
  }

  /**
   * Pauses all queued extraction/translation jobs for the project and sets status to PAUSED.
   */
  async pause(id: string): Promise<void> {
    await this.findOne(id); // Ensure project exists

    this.logger.log(`Project paused: ${id}`);
    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id },
        data: { status: ProjectStatus.PAUSED },
      }),
      this.prisma.job.updateMany({
        where: {
          projectId: id,
          status: JobStatus.QUEUED,
        },
        data: { status: JobStatus.PAUSED },
      }),
    ]);
  }

  /**
   * Resumes all paused extraction/translation jobs for the project and sets status to PROCESSING.
   */
  async resume(id: string): Promise<void> {
    await this.findOne(id); // Ensure project exists

    this.logger.log(`Project resumed: ${id}`);
    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id },
        data: { status: ProjectStatus.PROCESSING },
      }),
      this.prisma.job.updateMany({
        where: {
          projectId: id,
          status: JobStatus.PAUSED,
        },
        data: { status: JobStatus.QUEUED },
      }),
    ]);
  }

  /**
   * Cancels all pending/queued/paused jobs for the project and resets
   * project status to a stable state:
   *   - REVIEW  if at least one page has been extracted (status beyond PENDING/RENDERING)
   *   - DRAFT   if no extracted pages exist (e.g. extraction was cancelled mid-run)
   */
  async cancelJobs(id: string): Promise<void> {
    await this.findOne(id); // Ensure project exists

    const extractedPageCount = await this.prisma.page.count({
      where: {
        projectId: id,
        status: { notIn: [PageStatus.PENDING, PageStatus.RENDERING] },
      },
    });
    const newStatus =
      extractedPageCount > 0 ? ProjectStatus.REVIEW : ProjectStatus.DRAFT;

    await this.prisma.$transaction([
      this.prisma.job.updateMany({
        where: {
          projectId: id,
          status: { in: [JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.PAUSED] },
        },
        data: { status: JobStatus.CANCELLED, completedAt: new Date() },
      }),
      this.prisma.project.update({
        where: { id },
        data: { status: newStatus },
      }),
    ]);

    this.logger.log(`Project jobs cancelled: ${id}, status reset to ${newStatus}`);
  }

  /**
   * Enqueues a REVIEW_PAGE job for all translated pages in the project.
   */
  async enqueueReview(projectId: string, modelOverride?: string) {
    await this.findOne(projectId);

    const pagesToReview = await this.prisma.page.findMany({
      where: {
        projectId,
        translatedHtml: { not: null },
        status: { in: [PageStatus.TRANSLATED, PageStatus.HUMAN_REVIEW, PageStatus.REJECTED] },
      },
      select: { id: true },
    });

    if (pagesToReview.length === 0) {
      throw new BadRequestException('No translated pages found to review in this project.');
    }

    return this.prisma.job.create({
      data: {
        type: JobType.REVIEW_PAGE,
        status: JobStatus.QUEUED,
        projectId,
        payload: {
          projectId,
          pageIds: pagesToReview.map((p) => p.id),
          isBatchReview: true,
          ...(modelOverride ? { modelOverride } : {}),
        },
      },
    });
  }
}