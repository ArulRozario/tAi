import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SegmentUnit } from '@prisma/client';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.genre.findMany({
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        currentVersion: { select: { id: true, version: true, createdAt: true } },
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        currentVersion: true,
        versions: {
          include: { createdBy: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!genre) throw new NotFoundException(`Genre '${id}' not found.`);
    return genre;
  }

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
    },
  ) {
    const normalizedKey = data.key.toLowerCase().trim();
    const existing = await this.prisma.genre.findUnique({ where: { key: normalizedKey } });
    if (existing) throw new ConflictException(`Genre key '${data.key}' already exists.`);

    return this.prisma.$transaction(async (tx) => {
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

      const content = `# ${data.name}\n\n${data.description ?? ''}\n\n## System Prompt\n${data.systemPrompt ?? ''}\n\n## User Prompt Template\n${data.userPromptTemplate ?? ''}`;
      const v = await tx.genreVersion.create({
        data: { genreId: genre.id, version: '1.0', content, note: 'Initial version', createdById: userId },
      });

      return tx.genre.update({
        where: { id: genre.id },
        data: { currentVersionId: v.id },
        include: { currentVersion: true, createdBy: { select: { id: true, name: true, email: true } } },
      });
    });
  }

  async update(id: string, data: {
    name?: string;
    key?: string;
    description?: string;
    systemPrompt?: string;
    userPromptTemplate?: string;
    icon?: string;
    color?: string;
    segmentUnit?: SegmentUnit;
  }) {
    const genre = await this.prisma.genre.findUnique({ where: { id } });
    if (!genre) throw new NotFoundException(`Genre '${id}' not found.`);

    if (data.key !== undefined) {
      const norm = data.key.toLowerCase().trim();
      if (norm !== genre.key) {
        const dup = await this.prisma.genre.findUnique({ where: { key: norm } });
        if (dup) throw new ConflictException(`Genre key '${data.key}' already exists.`);
        data.key = norm;
      }
    }

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
        ...(data.segmentUnit !== undefined && { segmentUnit: data.segmentUnit }),
      },
      include: { currentVersion: true, createdBy: { select: { id: true, name: true, email: true } } },
    });
  }

  async delete(id: string): Promise<void> {
    const genre = await this.prisma.genre.findUnique({ where: { id } });
    if (!genre) throw new NotFoundException(`Genre '${id}' not found.`);
    await this.prisma.genre.delete({ where: { id } });
  }

  // ── Versions ────────────────────────────────────────────────────────────────

  async listVersions(genreId: string) {
    const genre = await this.prisma.genre.findUnique({ where: { id: genreId } });
    if (!genre) throw new NotFoundException(`Genre '${genreId}' not found.`);
    return this.prisma.genreVersion.findMany({
      where: { genreId },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addVersion(genreId: string, userId: string, content: string, note?: string) {
    const genre = await this.prisma.genre.findUnique({
      where: { id: genreId },
      include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!genre) throw new NotFoundException(`Genre '${genreId}' not found.`);

    const latestVersion = genre.versions[0]?.version ?? '1.0';
    const [major, minor] = latestVersion.split('.').map(Number);
    const nextVersion = `${major}.${(minor ?? 0) + 1}`;

    return this.prisma.$transaction(async (tx) => {
      const v = await tx.genreVersion.create({
        data: { genreId, version: nextVersion, content, note, createdById: userId },
        include: { createdBy: { select: { id: true, name: true, email: true } } },
      });
      await tx.genre.update({ where: { id: genreId }, data: { currentVersionId: v.id } });
      return v;
    });
  }

  async diffVersion(genreId: string, versionId: string) {
    const [genre, oldVersion] = await Promise.all([
      this.prisma.genre.findUnique({
        where: { id: genreId },
        include: { currentVersion: true },
      }),
      this.prisma.genreVersion.findUnique({ where: { id: versionId } }),
    ]);
    if (!genre) throw new NotFoundException(`Genre '${genreId}' not found.`);
    if (!oldVersion) throw new NotFoundException(`Version '${versionId}' not found.`);

    const oldLines = (oldVersion.content ?? '').split('\n');
    const newLines = (genre.currentVersion?.content ?? '').split('\n');
    const diff = this.computeLineDiff(oldLines, newLines);
    return { fromVersion: oldVersion.version, toVersion: genre.currentVersion?.version ?? 'current', diff };
  }

  private computeLineDiff(oldLines: string[], newLines: string[]): string {
    const oldSet = new Set(oldLines);
    const newSet = new Set(newLines);
    const result: string[] = [];
    let oi = 0, ni = 0;
    while (oi < oldLines.length || ni < newLines.length) {
      const ol = oldLines[oi];
      const nl = newLines[ni];
      if (ol === nl) {
        result.push(` ${ol}`);
        oi++; ni++;
      } else if (ol !== undefined && !newSet.has(ol)) {
        result.push(`-${ol}`);
        oi++;
      } else if (nl !== undefined && !oldSet.has(nl)) {
        result.push(`+${nl}`);
        ni++;
      } else {
        if (ol !== undefined) { result.push(`-${ol}`); oi++; }
        if (nl !== undefined) { result.push(`+${nl}`); ni++; }
      }
    }
    return result.join('\n');
  }

  async restoreVersion(genreId: string, versionId: string, userId: string) {
    const oldVersion = await this.prisma.genreVersion.findUnique({ where: { id: versionId } });
    if (!oldVersion) throw new NotFoundException(`Version '${versionId}' not found.`);
    return this.addVersion(genreId, userId, oldVersion.content, `Restored from v${oldVersion.version}`);
  }

  async testTranslation(genreId: string, sampleText: string) {
    const genre = await this.prisma.genre.findUnique({
      where: { id: genreId },
      include: { currentVersion: true },
    });
    if (!genre) throw new NotFoundException(`Genre '${genreId}' not found.`);
    // Stub: return input with note. Real implementation would call translation agent.
    return {
      translation: `[Test output for "${genre.name}" genre]\n\n${sampleText}`,
      tokensUsed: 0,
    };
  }
}
