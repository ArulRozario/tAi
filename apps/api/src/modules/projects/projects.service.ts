import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
        sourceLang: createProjectDto.sourceLang,
        targetLang: createProjectDto.targetLang,
        status: 'DRAFT',
      },
    });
  }

  async findAll(page: number = 1, limit: number = 20) {
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

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        pages: {
          orderBy: { pageNumber: 'asc' },
          select: {
            id: true,
            pageNumber: true,
            status: true,
            qualityScore: true,
          },
        },
        _count: {
          select: { pages: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id); // Verify exists

    const updateData: Record<string, unknown> = {};
    
    if (updateProjectDto.name !== undefined) {
      updateData.name = updateProjectDto.name;
    }
    if (updateProjectDto.description !== undefined) {
      updateData.description = updateProjectDto.description;
    }
    if (updateProjectDto.status !== undefined) {
      updateData.status = updateProjectDto.status;
    }
    if (updateProjectDto.settings !== undefined) {
      updateData.settings = updateProjectDto.settings;
    }

    return this.prisma.project.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verify exists

    return this.prisma.project.delete({
      where: { id },
    });
  }

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
      throw new NotFoundException(`Project with ID ${id} not found`);
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
}