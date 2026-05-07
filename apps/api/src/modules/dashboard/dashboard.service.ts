import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PageStatus, ProjectStatus } from '@prisma/client';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class DashboardService {
  private sharedCache = new Map<string, CacheEntry<unknown>>();
  private userCache = new Map<string, CacheEntry<unknown>>();

  constructor(private prisma: PrismaService) {}

  private getShared<T>(key: string): T | null {
    const entry = this.sharedCache.get(key) as CacheEntry<T> | undefined;
    if (entry && Date.now() < entry.expiresAt) return entry.data;
    return null;
  }

  private setShared<T>(key: string, data: T) {
    this.sharedCache.set(key, { data, expiresAt: Date.now() + 30_000 });
  }

  private getUserCached<T>(key: string): T | null {
    const entry = this.userCache.get(key) as CacheEntry<T> | undefined;
    if (entry && Date.now() < entry.expiresAt) return entry.data;
    return null;
  }

  private setUserCached<T>(key: string, data: T) {
    this.userCache.set(key, { data, expiresAt: Date.now() + 30_000 });
  }

  async getStats(userId: string) {
    const cacheKey = `stats:${userId}`;
    const cached = this.getUserCached<unknown>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      activeProjects,
      activeProjectsMonthAgo,
      pagesTranslated,
      pagesTranslatedWeekAgo,
      pendingReview,
      pendingReviewMonthAgo,
      userQueueCount,
      escalationCount,
      qualityAgg,
      qualityAggWeekAgo,
      lastSync,
    ] = await Promise.all([
      this.prisma.project.count({
        where: { status: { in: [ProjectStatus.PROCESSING, ProjectStatus.REVIEW] } },
      }),
      this.prisma.project.count({
        where: {
          status: { in: [ProjectStatus.PROCESSING, ProjectStatus.REVIEW] },
          createdAt: { lte: thirtyDaysAgo },
        },
      }),
      this.prisma.page.count({ where: { status: PageStatus.APPROVED } }),
      this.prisma.page.count({
        where: { status: PageStatus.APPROVED, updatedAt: { lte: sevenDaysAgo } },
      }),
      this.prisma.page.count({ where: { status: PageStatus.HUMAN_REVIEW } }),
      this.prisma.page.count({
        where: { status: PageStatus.HUMAN_REVIEW, createdAt: { lte: thirtyDaysAgo } },
      }),
      this.prisma.pageReviewer.count({ where: { userId, page: { status: PageStatus.HUMAN_REVIEW } } }),
      this.prisma.page.count({ where: { status: PageStatus.ESCALATED } }),
      this.prisma.page.aggregate({
        where: { status: { in: [PageStatus.HUMAN_REVIEW, PageStatus.APPROVED] }, quality: { not: null } },
        _avg: { quality: true },
      }),
      this.prisma.page.aggregate({
        where: {
          status: { in: [PageStatus.HUMAN_REVIEW, PageStatus.APPROVED] },
          quality: { not: null },
          updatedAt: { lte: sevenDaysAgo },
        },
        _avg: { quality: true },
      }),
      this.prisma.page.findFirst({
        where: { lastAiRunAt: { not: null } },
        orderBy: { lastAiRunAt: 'desc' },
        select: { lastAiRunAt: true },
      }),
    ]);

    const avgQuality = Math.round(qualityAgg._avg.quality ?? 0);
    const avgQualityOld = Math.round(qualityAggWeekAgo._avg.quality ?? 0);

    const result = {
      activeProjects,
      activeProjectsDeltaMonth: activeProjects - activeProjectsMonthAgo,
      pagesTranslated,
      pagesTranslatedDeltaWeek: pagesTranslated - pagesTranslatedWeekAgo,
      pendingReview,
      pendingReviewDelta: pendingReview - pendingReviewMonthAgo,
      userQueueCount,
      escalationCount,
      avgQuality,
      avgQualityDelta: avgQuality - avgQualityOld,
      lastSyncAt: lastSync?.lastAiRunAt?.toISOString() ?? null,
    };

    this.setUserCached(cacheKey, result);
    return result;
  }

  async getThroughput(metric: 'pages' | 'words', weeks: number) {
    const cacheKey = `throughput:${metric}:${weeks}`;
    const cached = this.getShared<unknown>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const result: { week: string; value: number }[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      let value = 0;
      if (metric === 'pages') {
        value = await this.prisma.page.count({
          where: {
            status: PageStatus.APPROVED,
            updatedAt: { gte: weekStart, lt: weekEnd },
          },
        });
      } else {
        const approvedPages = await this.prisma.page.findMany({
          where: {
            status: PageStatus.APPROVED,
            updatedAt: { gte: weekStart, lt: weekEnd },
          },
          select: { originalHtml: true },
        });
        value = approvedPages.reduce((sum, p) => {
          const text = p.originalHtml ? p.originalHtml.replace(/<[^>]+>/g, '') : '';
          return sum + text.split(/\s+/).filter(Boolean).length;
        }, 0);
      }

      const label = weekStart.toISOString().split('T')[0];
      result.push({ week: label, value });
    }

    this.setShared(cacheKey, result);
    return result;
  }

  async getMyQueue(userId: string, limit: number) {
    const pages = await this.prisma.page.findMany({
      where: {
        status: PageStatus.HUMAN_REVIEW,
        reviewers: { some: { userId } },
      },
      take: limit,
      orderBy: [{ priority: 'desc' }, { assignedAt: 'asc' }],
      include: {
        project: { select: { id: true, name: true, sourceLang: true, targetLang: true } },
        chapter: { select: { id: true, number: true, title: true } },
        reviewers: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
      },
    });

    return pages.map((p) => ({
      id: p.id,
      pageNumber: p.pageNumber,
      project: p.project,
      chapter: p.chapter,
      status: p.status,
      priority: p.priority,
      quality: p.quality,
      assignedAt: p.assignedAt,
      reviewers: p.reviewers.map((r) => r.user),
    }));
  }

  async getRecentProjects(limit: number) {
    const cacheKey = `recent-projects:${limit}`;
    const cached = this.getShared<unknown>(cacheKey);
    if (cached) return cached;

    const projects = await this.prisma.project.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        genre: { select: { id: true, name: true, icon: true, color: true } },
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { pages: true } },
      },
    });

    const result = await Promise.all(
      projects.map(async (p) => {
        const [completedCount, totalCount] = await Promise.all([
          this.prisma.page.count({ where: { projectId: p.id, status: PageStatus.APPROVED } }),
          this.prisma.page.count({ where: { projectId: p.id } }),
        ]);
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          genre: p.genre,
          owner: p.owner,
          sourceLang: p.sourceLang,
          targetLang: p.targetLang,
          pageCount: totalCount,
          completedCount,
          progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        };
      }),
    );

    this.setShared(cacheKey, result);
    return result;
  }

  async getActivity(limit: number) {
    const cacheKey = `activity:${limit}`;
    const cached = this.getShared<unknown>(cacheKey);
    if (cached) return cached;

    const logs = await this.prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    this.setShared(cacheKey, logs);
    return logs;
  }
}
