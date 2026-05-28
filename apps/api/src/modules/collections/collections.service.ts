import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';

export interface CollectionNode {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  children: CollectionNode[];
  _count: { projects: number };
}

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Queries ──────────────────────────────────────────────────────────────

  /**
   * Returns the full collection tree rooted at the given node (or all roots
   * when rootId is undefined).  Uses a recursive CTE so depth is unbounded.
   */
  async getTree(rootId?: string): Promise<CollectionNode[]> {
    type Row = {
      id: string;
      name: string;
      description: string | null;
      icon: string | null;
      color: string | null;
      parentId: string | null;
      orderIndex: number;
      createdAt: Date;
      updatedAt: Date;
      projectCount: bigint;
    };

    let rows: Row[];

    if (rootId) {
      // Sub-tree rooted at a specific collection
      rows = await this.prisma.$queryRaw<Row[]>`
        WITH RECURSIVE tree AS (
          SELECT c.*,
            (SELECT COUNT(*) FROM "Project" p WHERE p."collectionId" = c.id) AS "projectCount"
          FROM   "ProjectCollection" c
          WHERE  c.id = ${rootId}
          UNION ALL
          SELECT c.*,
            (SELECT COUNT(*) FROM "Project" p WHERE p."collectionId" = c.id) AS "projectCount"
          FROM   "ProjectCollection" c
          JOIN   tree t ON c."parentId" = t.id
        )
        SELECT * FROM tree ORDER BY "orderIndex", "createdAt"
      `;
    } else {
      // Full tree — start from all root nodes (parentId IS NULL)
      rows = await this.prisma.$queryRaw<Row[]>`
        WITH RECURSIVE tree AS (
          SELECT c.*,
            (SELECT COUNT(*) FROM "Project" p WHERE p."collectionId" = c.id) AS "projectCount"
          FROM   "ProjectCollection" c
          WHERE  c."parentId" IS NULL
          UNION ALL
          SELECT c.*,
            (SELECT COUNT(*) FROM "Project" p WHERE p."collectionId" = c.id) AS "projectCount"
          FROM   "ProjectCollection" c
          JOIN   tree t ON c."parentId" = t.id
        )
        SELECT * FROM tree ORDER BY "orderIndex", "createdAt"
      `;
    }

    return this.buildTree(rows, rootId ?? null);
  }

  /** Returns a single flat collection (no recursive children). */
  async findOne(id: string) {
    const collection = await this.prisma.projectCollection.findUnique({
      where: { id },
      include: {
        _count: { select: { projects: true } },
        parent: { select: { id: true, name: true } },
      },
    });
    if (!collection) throw new NotFoundException(`Collection ${id} not found`);
    return collection;
  }

  // ─── Mutations ────────────────────────────────────────────────────────────

  async create(dto: CreateCollectionDto) {
    if (dto.parentId) {
      const parent = await this.prisma.projectCollection.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new NotFoundException(`Parent collection ${dto.parentId} not found`);
    }

    return this.prisma.projectCollection.create({
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        parentId: dto.parentId ?? null,
        orderIndex: dto.orderIndex ?? 0,
      },
      include: { _count: { select: { projects: true } } },
    });
  }

  async update(id: string, dto: UpdateCollectionDto) {
    await this.findOne(id); // 404 guard

    if (dto.parentId !== undefined && dto.parentId !== null) {
      // Reject cycles: new parent must not be a descendant of `id`
      if (dto.parentId === id) {
        throw new BadRequestException('A collection cannot be its own parent');
      }
      const isDescendant = await this.isDescendant(dto.parentId, id);
      if (isDescendant) {
        throw new BadRequestException(
          'Cannot move a collection into one of its own descendants',
        );
      }
    }

    return this.prisma.projectCollection.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...('parentId' in dto && { parentId: dto.parentId }),
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
      },
      include: { _count: { select: { projects: true } } },
    });
  }

  /**
   * Deletes a collection.
   * - Immediate children are re-parented to the deleted node's parent (grandparent).
   * - Projects in this collection have their collectionId set to null (handled by DB SetNull).
   */
  async remove(id: string) {
    const collection = await this.findOne(id);

    // Re-parent direct children to grandparent before deletion
    await this.prisma.projectCollection.updateMany({
      where: { parentId: id },
      data: { parentId: collection.parentId ?? null },
    });

    await this.prisma.projectCollection.delete({ where: { id } });
    this.logger.log(`Collection deleted: ${id} "${collection.name}"`);
  }

  // ─── Project assignment ───────────────────────────────────────────────────

  async assignProject(projectId: string, collectionId: string | null) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    if (collectionId !== null) {
      const collection = await this.prisma.projectCollection.findUnique({
        where: { id: collectionId },
      });
      if (!collection) throw new NotFoundException(`Collection ${collectionId} not found`);
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: { collectionId },
      include: { collection: true },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Returns true when `candidateId` is a descendant of `ancestorId`.
   * Uses a recursive CTE to walk the tree upward from the candidate.
   */
  private async isDescendant(
    candidateId: string,
    ancestorId: string,
  ): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      WITH RECURSIVE ancestors AS (
        SELECT id, "parentId" FROM "ProjectCollection" WHERE id = ${candidateId}
        UNION ALL
        SELECT c.id, c."parentId"
        FROM   "ProjectCollection" c
        JOIN   ancestors a ON c.id = a."parentId"
      )
      SELECT id FROM ancestors WHERE id = ${ancestorId}
    `;
    return rows.length > 0;
  }

  /** Converts a flat list of rows (from the CTE) into a nested tree. */
  private buildTree(
    rows: Array<{
      id: string;
      name: string;
      description: string | null;
      icon: string | null;
      color: string | null;
      parentId: string | null;
      orderIndex: number;
      createdAt: Date;
      updatedAt: Date;
      projectCount: bigint;
    }>,
    rootParentId: string | null,
  ): CollectionNode[] {
    const map = new Map<string, CollectionNode>();

    for (const row of rows) {
      map.set(row.id, {
        id: row.id,
        name: row.name,
        description: row.description,
        icon: row.icon,
        color: row.color,
        parentId: row.parentId,
        orderIndex: row.orderIndex,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        children: [],
        _count: { projects: Number(row.projectCount) },
      });
    }

    const roots: CollectionNode[] = [];

    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
