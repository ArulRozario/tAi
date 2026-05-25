import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { interval, Subject, Subscription, switchMap, startWith } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';

import { ApiService, DashboardStats, ActivityLog, Page, Project } from '../core/services/api.service';
import { AuthService } from '../auth/auth.service';

interface StatCard {
  label: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  deltaLabel: string;
}

interface QueueItem {
  id: string;
  page: string;
  project: string;
  errorCount: number;
  priority: string;
  prioritySeverity: 'danger' | 'warn' | 'info' | 'secondary';
}

interface RecentProject {
  id: string;
  name: string;
  progress: number;
}

interface ActivityItem {
  user: string;
  initials: string;
  avatarBg: string;
  action: string;
  target: string;
  href: string | null;
  time: string;
}

const PRIORITY_MAP: Record<string, { label: string; severity: QueueItem['prioritySeverity'] }> = {
  CRITICAL: { label: 'Crit',   severity: 'danger' },
  HIGH:     { label: 'High',   severity: 'warn' },
  MEDIUM:   { label: 'Medium', severity: 'info' },
  LOW:      { label: 'Low',    severity: 'secondary' },
  NORMAL:   { label: 'Normal', severity: 'secondary' },
};

const AVATAR_COLORS = ['#f43f5e', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    AvatarModule,
    ProgressBarModule,
    TagModule,
    SkeletonModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  get userName(): string {
    return this.auth.getCurrentUser()?.name?.split(' ')[0] ?? 'there';
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  lastSync: string | null = null;
  userQueueCount = 0;
  escalationCount = 0;

  stats: StatCard[] = [];
  statsLoading = signal(true);

  throughputMetric: 'pages' | 'words' = 'pages';
  throughputPeak = 0;
  throughputAvg = 0;
  throughputTotal = 0;
  throughputData: number[] = [];

  queueItems: QueueItem[] = [];
  recentProjects: RecentProject[] = [];
  recentActivity: ActivityItem[] = [];

  private subs = new Subscription();
  private throughputMetric$ = new Subject<'pages' | 'words'>();

  ngOnInit() {
    this.subs.add(
      interval(30_000)
        .pipe(startWith(0), switchMap(() => this.api.getDashboardStats()))
        .subscribe(s => { this.applyStats(s); this.cdr.markForCheck(); }),
    );
    this.subs.add(
      this.throughputMetric$.pipe(startWith(this.throughputMetric), switchMap(m => this.api.getDashboardThroughput(m, 12)))
        .subscribe(data => {
          const values = data.map(d => d.value);
          const max = Math.max(...values, 1);
          this.throughputData  = values.map(v => Math.round((v / max) * 100));
          this.throughputTotal = values.reduce((a, b) => a + b, 0);
          this.throughputPeak  = Math.max(...values);
          this.throughputAvg   = Math.round(this.throughputTotal / (values.length || 1));
          this.cdr.markForCheck();
        }),
    );
    this.subs.add(this.api.getMyQueue(5).subscribe(p => { this.applyQueue(p); this.cdr.markForCheck(); }));
    this.subs.add(this.api.getRecentProjects(4).subscribe(p => { this.applyProjects(p); this.cdr.markForCheck(); }));
    this.subs.add(this.api.getActivityFeed(10).subscribe(l => { this.applyActivity(l); this.cdr.markForCheck(); }));
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  setMetric(metric: 'pages' | 'words') {
    if (this.throughputMetric === metric) return;
    this.throughputMetric = metric;
    this.throughputMetric$.next(metric);
  }

  private applyStats(s: DashboardStats) {
    this.statsLoading.set(false);
    this.userQueueCount  = s.userQueueCount;
    this.escalationCount = s.escalationCount;
    this.lastSync        = s.lastSyncAt ? this.relTime(new Date(s.lastSyncAt)) : 'never';

    this.stats = [
      {
        label:      'Active projects',
        value:      String(s.activeProjects),
        delta:      this.signed(s.activeProjectsDeltaMonth),
        deltaUp:    s.activeProjectsDeltaMonth >= 0,
        deltaLabel: 'this month',
      },
      {
        label:      'Pages translated',
        value:      s.pagesTranslated.toLocaleString(),
        delta:      this.signed(s.pagesTranslatedDeltaWeek),
        deltaUp:    s.pagesTranslatedDeltaWeek >= 0,
        deltaLabel: 'this week',
      },
      {
        label:      'Pending review',
        value:      String(s.pendingReview),
        delta:      this.signed(s.pendingReviewDelta),
        deltaUp:    s.pendingReviewDelta <= 0,
        deltaLabel: 'vs last month',
      },
      {
        label:      'Avg quality',
        value:      s.avgQuality ? `${s.avgQuality}%` : '–',
        delta:      this.signed(s.avgQualityDelta) + 'pts',
        deltaUp:    s.avgQualityDelta >= 0,
        deltaLabel: '',
      },
    ];
  }

  private applyQueue(pages: Page[]) {
    this.queueItems = pages.map(p => {
      const pm = PRIORITY_MAP[p.priority] ?? { label: p.priority, severity: 'secondary' as const };
      return {
        id:               p.id,
        page:             `P${p.pageNumber}`,
        project:          p.project?.name ?? '–',
        errorCount:       p.errorCount ?? 0,
        priority:         pm.label,
        prioritySeverity: pm.severity,
      };
    });
  }

  private applyProjects(projects: Project[]) {
    this.recentProjects = projects.map(p => ({
      id:       p.id,
      name:     p.name,
      progress: p.progress ?? 0,
    }));
  }

  private applyActivity(logs: ActivityLog[]) {
    this.recentActivity = logs.map((log, i) => {
      const userName = log.user?.name ?? 'System';
      const initials  = userName === 'System'
        ? 'AI'
        : userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
      const target = log.entityName
        ? log.entityName
        : log.entityType
          ? log.entityType.charAt(0).toUpperCase() + log.entityType.slice(1).toLowerCase()
          : '';
      return {
        user:     userName,
        initials,
        avatarBg: userName === 'System' ? '#64748b' : AVATAR_COLORS[i % AVATAR_COLORS.length],
        action:   this.fmtAction(log.action),
        target,
        href:     log.entityHref ?? null,
        time:     this.relTime(new Date(log.createdAt)),
      };
    });
  }

  navigateActivity(act: ActivityItem) {
    if (act.href) this.router.navigateByUrl(act.href);
  }

  private fmtAction(action: string): string {
    return action.toLowerCase().replace(/_/g, ' ');
  }

  private relTime(date: Date): string {
    const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  private signed(n: number): string {
    return n >= 0 ? `+${n}` : `${n}`;
  }
}
