import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId?: string) {
    if (projectId) {
      const overrides = await this.prisma.ruleOverride.findMany({
        where: { projectId },
        include: { rule: true },
      });
      return overrides.map(o => ({
        ...o.rule,
        overrideContent: o.overrideContent,
        overrideFrontmatter: o.overrideFrontmatter,
        overrideActive: o.isActive,
      }));
    }
    return this.prisma.rule.findMany({ orderBy: { category: 'asc' } });
  }

  async create(data: { name: string; content: string; category: any; priority?: number; description?: string }) {
    return this.prisma.rule.create({ data });
  }

  async update(id: string, data: { name?: string; content?: string; category?: any; priority?: number; description?: string }) {
    const rule = await this.prisma.rule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Rule not found');
    return this.prisma.rule.update({ where: { id }, data });
  }

  async delete(id: string) {
    const rule = await this.prisma.rule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Rule not found');
    await this.prisma.rule.delete({ where: { id } });
    return { success: true };
  }

  async createOverride(projectId: string, ruleId: string, overrideContent: string, isActive: boolean) {
    return this.prisma.ruleOverride.upsert({
      where: { projectId_ruleId: { projectId, ruleId } },
      create: { projectId, ruleId, overrideContent, isActive },
      update: { overrideContent, isActive },
    });
  }
}