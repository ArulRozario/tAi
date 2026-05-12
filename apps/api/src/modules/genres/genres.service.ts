import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SegmentUnit } from '@prisma/client';

@Injectable()
export class GenresService {
  private readonly logger = new Logger(GenresService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(q?: string, limit?: number) {
    return this.prisma.styleGuide.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
      take: limit,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        currentVersion: { select: { id: true, version: true, createdAt: true } },
        _count: { select: { projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const genre = await this.prisma.styleGuide.findUnique({
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
      description?: string;
      icon?: string;
      color?: string;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const genre = await tx.styleGuide.create({
        data: {
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: data.color,
          createdById: userId,
        },
      });

      const content = `# ${data.name}\n\n${data.description ?? ''}\n`;
      const v = await tx.styleGuideVersion.create({
        data: { styleGuideId: genre.id, version: '1.0', content, note: 'Initial version', createdById: userId },
      });

      const result = await tx.styleGuide.update({
        where: { id: genre.id },
        data: { currentVersionId: v.id },
        include: { currentVersion: true, createdBy: { select: { id: true, name: true, email: true } } },
      });
      this.logger.log(`Genre created: ${genre.id} "${data.name}" by user ${userId}`);
      return result;
    });
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    segmentUnit?: SegmentUnit;
  }) {
    const genre = await this.prisma.styleGuide.findUnique({ where: { id } });
    if (!genre) throw new NotFoundException(`Genre '${id}' not found.`);

    return this.prisma.styleGuide.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.segmentUnit !== undefined && { segmentUnit: data.segmentUnit }),
      },
      include: { currentVersion: true, createdBy: { select: { id: true, name: true, email: true } } },
    });
  }

  async delete(id: string): Promise<void> {
    const genre = await this.prisma.styleGuide.findUnique({ where: { id } });
    if (!genre) throw new NotFoundException(`Genre '${id}' not found.`);
    await this.prisma.styleGuide.delete({ where: { id } });
    this.logger.warn(`Genre deleted: ${id} "${genre.name}"`);
  }

  // ── Versions ────────────────────────────────────────────────────────────────

  async findVersion(genreId: string, versionId: string) {
    const version = await this.prisma.styleGuideVersion.findFirst({
      where: { id: versionId, styleGuideId: genreId },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    if (!version) throw new NotFoundException(`Version '${versionId}' not found for genre '${genreId}'.`);
    return version;
  }

  async listVersions(genreId: string) {
    const genre = await this.prisma.styleGuide.findUnique({ where: { id: genreId } });
    if (!genre) throw new NotFoundException(`Genre '${genreId}' not found.`);
    return this.prisma.styleGuideVersion.findMany({
      where: { styleGuideId: genreId },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addVersion(genreId: string, userId: string, content: string, note?: string) {
    const genre = await this.prisma.styleGuide.findUnique({
      where: { id: genreId },
      include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!genre) throw new NotFoundException(`Genre '${genreId}' not found.`);

    const latestVersion = genre.versions[0]?.version ?? '1.0';
    const [major, minor] = latestVersion.split('.').map(Number);
    const nextVersion = `${major}.${(minor ?? 0) + 1}`;

    return this.prisma.$transaction(async (tx) => {
      const v = await tx.styleGuideVersion.create({
        data: { styleGuideId: genreId, version: nextVersion, content, note, createdById: userId },
        include: { createdBy: { select: { id: true, name: true, email: true } } },
      });
      await tx.styleGuide.update({ where: { id: genreId }, data: { currentVersionId: v.id } });
      this.logger.log(`Genre version saved: ${genreId} → v${nextVersion} by user ${userId}`);
      return v;
    });
  }

  async diffVersion(genreId: string, versionId: string) {
    const [genre, oldVersion] = await Promise.all([
      this.prisma.styleGuide.findUnique({
        where: { id: genreId },
        include: { currentVersion: true },
      }),
      this.prisma.styleGuideVersion.findUnique({ where: { id: versionId } }),
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
    const oldVersion = await this.prisma.styleGuideVersion.findUnique({ where: { id: versionId } });
    if (!oldVersion) throw new NotFoundException(`Version '${versionId}' not found.`);
    this.logger.warn(`Genre version restored: ${genreId} to v${oldVersion.version} by user ${userId}`);
    return this.addVersion(genreId, userId, oldVersion.content, `Restored from v${oldVersion.version}`);
  }

  async testTranslation(genreId: string, sampleText: string) {
    const genre = await this.prisma.styleGuide.findUnique({
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
