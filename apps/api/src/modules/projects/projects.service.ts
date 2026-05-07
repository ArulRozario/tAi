import { 
  Injectable, 
  NotFoundException, 
  ConflictException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { JobsService } from '../jobs/jobs.service';
import { JobType, ProjectStatus, JobStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
  ) {}

  /**
   * Creates a new translation project.
   * Links the project to an active genre and sets the creating user as owner.
   */
  async create(ownerId: string, createProjectDto: CreateProjectDto) {
    // 1. Verify target genre exists
    const genre = await this.prisma.genre.findUnique({
      where: { id: createProjectDto.genreId },
    });

    if (!genre) {
      throw new NotFoundException(`Genre with ID '${createProjectDto.genreId}' not found.`);
    }

    // 2. Persist the project in DRAFT status
    const project = await this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
        sourceLang: createProjectDto.sourceLang,
        targetLang: createProjectDto.targetLang,
        genreId: createProjectDto.genreId,
        ownerId,
        status: ProjectStatus.DRAFT,
        sourceFileId: createProjectDto.sourceFileId,
      },
      include: {
        genre: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      }
    });

    // 3. Atomically enqueue PROCESS_DOCUMENT job if sourceFileId is provided
    if (createProjectDto.sourceFileId) {
      try {
        await this.jobsService.enqueue({
          type: JobType.PROCESS_DOCUMENT,
          projectId: project.id,
          payload: {
            projectId: project.id,
            sourceFileId: createProjectDto.sourceFileId,
          },
        });

        // Set project status to PROCESSING
        return await this.prisma.project.update({
          where: { id: project.id },
          data: { status: ProjectStatus.PROCESSING },
          include: {
            genre: true,
            owner: {
              select: { id: true, name: true, email: true },
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

    return project;
  }

  /**
   * Retrieves all projects, ordered newest first.
   */
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          genre: {
            select: { id: true, name: true },
          },
          _count: {
            select: { pages: true },
          },
        },
      }),
      this.prisma.project.count(),
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
          select: { id: true, name: true, email: true },
        },
        genre: {
          select: { id: true, name: true },
        },
        pages: {
          orderBy: { pageNumber: 'asc' },
          select: {
            id: true,
            pageNumber: true,
            status: true,
            quality: true,
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
          select: { id: true, name: true, email: true },
        },
        genre: {
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
   * Dynamically resolves the terms via the project's linked Genre.
   */
  async findGlossaryTerms(projectId: string) {
    const project = await this.findOne(projectId); // Ensure project exists and retrieve metadata

    return this.prisma.glossaryTerm.findMany({
      where: { genreId: project.genreId },
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

    const stats = {
      total: project.pages.length,
      pending: 0,
      extracting: 0,
      extracted: 0,
      translating: 0,
      translated: 0,
      reviewing: 0,
      humanReview: 0,
      approved: 0,
      rejected: 0,
      error: 0,
    };

    project.pages.forEach((page) => {
      const status = page.status as keyof typeof stats;
      if (status in stats) {
        stats[status]++;
      }
    });

    return stats;
  }

  /**
   * Pauses all queued extraction/translation jobs for the project and sets status to PAUSED.
   */
  async pause(id: string): Promise<void> {
    await this.findOne(id); // Ensure project exists

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
   * Cancels all pending/queued/paused jobs for the project.
   */
  async cancelJobs(id: string): Promise<void> {
    await this.findOne(id); // Ensure project exists

    await this.prisma.job.updateMany({
      where: {
        projectId: id,
        status: {
          in: [JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.PAUSED],
        },
      },
      data: {
        status: JobStatus.CANCELLED,
        completedAt: new Date(),
      },
    });
  }
}