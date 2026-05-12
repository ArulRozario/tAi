import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SegmentUnit } from '@prisma/client';

@Injectable()
export class StyleGuidesService {
  private readonly logger = new Logger(StyleGuidesService.name);

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
    const styleGuide = await this.prisma.styleGuide.findUnique({
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
    if (!styleGuide) throw new NotFoundException(`StyleGuide '${id}' not found.`);
    return styleGuide;
  }

  async create(
    userId: string,
    data: {
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      content?: string;
    },
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const styleGuide = await tx.styleGuide.create({
        data: {
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: data.color,
          createdById: userId,
        },
      });

      const content = data.content ?? `# ${data.name}\n\n${data.description ?? ''}\n`;
      const v = await tx.styleGuideVersion.create({
        data: { styleGuideId: styleGuide.id, version: '1.0', content, note: 'Initial version', createdById: userId },
      });

      return tx.styleGuide.update({
        where: { id: styleGuide.id },
        data: { currentVersionId: v.id },
        include: { currentVersion: true, createdBy: { select: { id: true, name: true, email: true } } },
      });
    });
    this.logger.log(`StyleGuide created: "${result.name}" (${result.id}) by user ${userId}`);
    return result;
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    segmentUnit?: SegmentUnit;
  }) {
    const styleGuide = await this.prisma.styleGuide.findUnique({ where: { id } });
    if (!styleGuide) throw new NotFoundException(`StyleGuide '${id}' not found.`);

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
    const styleGuide = await this.prisma.styleGuide.findUnique({ where: { id } });
    if (!styleGuide) throw new NotFoundException(`StyleGuide '${id}' not found.`);

    const projectCount = await this.prisma.project.count({ where: { styleGuideId: id } });
    if (projectCount > 0) {
      this.logger.warn(`Delete blocked for styleGuide "${styleGuide.name}" (${id}) — ${projectCount} project(s) reference it`);
      throw new ConflictException(
        `Cannot delete styleGuide '${styleGuide.name}' — ${projectCount} project(s) reference it. Remove or reassign the projects first.`
      );
    }

    await this.prisma.styleGuide.delete({ where: { id } });
    this.logger.warn(`StyleGuide deleted: "${styleGuide.name}" (${id})`);
  }

  // ── Versions ────────────────────────────────────────────────────────────────

  async findVersion(styleGuideId: string, versionId: string) {
    const version = await this.prisma.styleGuideVersion.findFirst({
      where: { id: versionId, styleGuideId },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    if (!version) throw new NotFoundException(`Version '${versionId}' not found for styleGuide '${styleGuideId}'.`);
    return version;
  }

  async listVersions(styleGuideId: string) {
    const styleGuide = await this.prisma.styleGuide.findUnique({ where: { id: styleGuideId } });
    if (!styleGuide) throw new NotFoundException(`StyleGuide '${styleGuideId}' not found.`);
    return this.prisma.styleGuideVersion.findMany({
      where: { styleGuideId },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addVersion(styleGuideId: string, userId: string, content: string, note?: string) {
    const styleGuide = await this.prisma.styleGuide.findUnique({
      where: { id: styleGuideId },
      include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!styleGuide) throw new NotFoundException(`StyleGuide '${styleGuideId}' not found.`);

    const latestVersion = styleGuide.versions[0]?.version ?? '1.0';
    const [major, minor] = latestVersion.split('.').map(Number);
    const nextVersion = `${major}.${(minor ?? 0) + 1}`;

    const v = await this.prisma.$transaction(async (tx) => {
      const version = await tx.styleGuideVersion.create({
        data: { styleGuideId, version: nextVersion, content, note, createdById: userId },
        include: { createdBy: { select: { id: true, name: true, email: true } } },
      });
      await tx.styleGuide.update({ where: { id: styleGuideId }, data: { currentVersionId: version.id } });
      return version;
    });
    this.logger.log(`StyleGuide ${styleGuideId} new version ${v.version} saved by user ${userId}`);
    return v;
  }

  async diffVersion(styleGuideId: string, versionId: string) {
    const [styleGuide, oldVersion] = await Promise.all([
      this.prisma.styleGuide.findUnique({
        where: { id: styleGuideId },
        include: { currentVersion: true },
      }),
      this.prisma.styleGuideVersion.findUnique({ where: { id: versionId } }),
    ]);
    if (!styleGuide) throw new NotFoundException(`StyleGuide '${styleGuideId}' not found.`);
    if (!oldVersion) throw new NotFoundException(`Version '${versionId}' not found.`);

    const oldLines = (oldVersion.content ?? '').split('\n');
    const newLines = (styleGuide.currentVersion?.content ?? '').split('\n');
    const diff = this.computeLineDiff(oldLines, newLines);
    return { fromVersion: oldVersion.version, toVersion: styleGuide.currentVersion?.version ?? 'current', diff };
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

  async restoreVersion(styleGuideId: string, versionId: string, userId: string) {
    const oldVersion = await this.prisma.styleGuideVersion.findUnique({ where: { id: versionId } });
    if (!oldVersion) throw new NotFoundException(`Version '${versionId}' not found.`);
    return this.addVersion(styleGuideId, userId, oldVersion.content, `Restored from v${oldVersion.version}`);
  }

  async testTranslation(styleGuideId: string, sampleText: string) {
    const styleGuide = await this.prisma.styleGuide.findUnique({
      where: { id: styleGuideId },
      include: { currentVersion: true },
    });
    if (!styleGuide) throw new NotFoundException(`StyleGuide '${styleGuideId}' not found.`);
    // Stub: return input with note. Real implementation would call translation agent.
    return {
      translation: `[Test output for "${styleGuide.name}" styleGuide]\n\n${sampleText}`,
      tokensUsed: 0,
    };
  }
}
