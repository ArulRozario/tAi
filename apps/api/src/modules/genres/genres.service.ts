import { 
  Injectable, 
  NotFoundException, 
  ConflictException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all genres in the database.
   * Ordered by creation date newest first.
   */
  async findAll() {
    return this.prisma.genre.findMany({
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves a single genre by ID.
   * Throws NotFoundException if the genre does not exist.
   */
  async findOne(id: string) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        versions: {
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    if (!genre) {
      throw new NotFoundException(`Genre with ID '${id}' not found.`);
    }

    return genre;
  }

  /**
   * Creates a new translation genre.
   * Enforces uniqueness on the 'key' parameter and generates an initial version 1.0 record.
   */
  async create(
    userId: string,
    data: {
      name: string;
      key: string;
      description?: string;
      systemPrompt?: string;
      userPromptTemplate?: string;
      icon?: string;
      color?: string;
    }
  ) {
    const normalizedKey = data.key.toLowerCase().trim();

    // 1. Enforce unique key constraint
    const existingKey = await this.prisma.genre.findUnique({
      where: { key: normalizedKey },
    });

    if (existingKey) {
      throw new ConflictException(`Genre with key '${data.key}' already exists.`);
    }

    // 2. Perform transaction to create genre and generate its initial Version 1.0
    return this.prisma.$transaction(async (tx) => {
      // Create Genre
      const genre = await tx.genre.create({
        data: {
          name: data.name,
          key: normalizedKey,
          description: data.description,
          systemPrompt: data.systemPrompt,
          userPromptTemplate: data.userPromptTemplate,
          icon: data.icon,
          color: data.color,
          createdById: userId,
        },
      });

      // Assemble content for version 1.0
      const contentStr = `System Prompt:\n${data.systemPrompt || ''}\n\nUser Prompt Template:\n${data.userPromptTemplate || ''}`;

      // Create initial GenreVersion
      const initialVersion = await tx.genreVersion.create({
        data: {
          genreId: genre.id,
          version: '1.0',
          content: contentStr,
          note: 'Initial scaffolding of translation prompts',
          createdById: userId,
        },
      });

      // Link currentVersion back to Genre
      return tx.genre.update({
        where: { id: genre.id },
        data: { currentVersionId: initialVersion.id },
        include: {
          currentVersion: true,
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        },
      });
    });
  }

  /**
   * Modifies an existing genre's configuration and prompts.
   */
  async update(
    id: string,
    data: {
      name?: string;
      key?: string;
      description?: string;
      systemPrompt?: string;
      userPromptTemplate?: string;
      icon?: string;
      color?: string;
    }
  ) {
    // 1. Verify existence
    const genre = await this.prisma.genre.findUnique({ where: { id } });
    if (!genre) {
      throw new NotFoundException(`Genre with ID '${id}' not found.`);
    }

    // 2. If changing key, enforce key uniqueness
    if (data.key !== undefined) {
      const normalizedKey = data.key.toLowerCase().trim();
      if (normalizedKey !== genre.key) {
        const existingKey = await this.prisma.genre.findUnique({
          where: { key: normalizedKey },
        });
        if (existingKey) {
          throw new ConflictException(`Genre with key '${data.key}' already exists.`);
        }
        data.key = normalizedKey;
      }
    }

    // 3. Update record and optionally increment/append a new version 
    // (We will update the core genre prompt fields, which is the primary source of truth)
    return this.prisma.genre.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.key !== undefined && { key: data.key }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.systemPrompt !== undefined && { systemPrompt: data.systemPrompt }),
        ...(data.userPromptTemplate !== undefined && { userPromptTemplate: data.userPromptTemplate }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
      },
      include: {
        currentVersion: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  /**
   * Administratively deletes a genre from the system.
   * Cascade rule deletes all linked versions.
   */
  async delete(id: string): Promise<void> {
    // 1. Verify existence
    const genre = await this.prisma.genre.findUnique({ where: { id } });
    if (!genre) {
      throw new NotFoundException(`Genre with ID '${id}' not found.`);
    }

    // 2. Perform cascade cleanup (Prisma's onDelete: Cascade in schema handles the Version child rows)
    await this.prisma.genre.delete({
      where: { id },
    });
  }
}
