import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, forkJoin } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { ApiService, DashboardStats, ActivityLog, Project, Page } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { StatusDotComponent } from '../../shared/ui/status-dot/status-dot.component';
import { PriorityPillComponent } from '../../shared/ui/priority-pill/priority-pill.component';

function relativeTime(iso: string | null): string {
  if (!iso) return 'unknown';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function greeting(name: string): string {
  const h = new Date().getHours();
  const salutation = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${salutation}, ${name.split(' ')[0]}`;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, ProgressBarModule, AvatarModule, StatusDotComponent, PriorityPillComponent],
  template: `
    <div class="page fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ greetingText }}</h1>
          <p class="page-subtitle" *ngIf="stats">
            {{ stats.userQueueCount }} pages need your review
            <ng-container *ngIf="stats.escalationCount > 0"> · {{ stats.escalationCount }} escalations open</ng-container>
            <ng-container *ngIf="stats.lastSyncAt"> · last sync {{ lastSync }} ago</ng-container>
          </p>
        </div>
        <button pButton icon="pi pi-plus" label="New project" severity="primary" routerLink="/projects" [queryParams]="{new: 'true'}"></button>
      </div>

      <!-- Stat cards -->
      <div class="grid--4 mb-8" *ngIf="stats; else statsSkeleton">
        <div class="card">
          <div class="card-eyebrow">Active projects</div>
          <div class="text-3xl font-mono font-bold mt-1 mb-2">{{ stats.activeProjects }}</div>
          <div class="text-xs font-medium" [class.text-success]="stats.activeProjectsDeltaMonth >= 0" [class.text-error]="stats.activeProjectsDeltaMonth < 0">
            <i class="pi text-[10px] mr-1" [class.pi-arrow-up]="stats.activeProjectsDeltaMonth >= 0" [class.pi-arrow-down]="stats.activeProjectsDeltaMonth < 0"></i>
            {{ stats.activeProjectsDeltaMonth >= 0 ? '+' : '' }}{{ stats.activeProjectsDeltaMonth }} this month
          </div>
        </div>
        <div class="card">
          <div class="card-eyebrow">Pages translated</div>
          <div class="text-3xl font-mono font-bold mt-1 mb-2">{{ stats.pagesTranslated | number }}</div>
          <div class="text-xs font-medium" [class.text-success]="stats.pagesTranslatedDeltaWeek >= 0" [class.text-error]="stats.pagesTranslatedDeltaWeek < 0">
            <i class="pi text-[10px] mr-1" [class.pi-arrow-up]="stats.pagesTranslatedDeltaWeek >= 0" [class.pi-arrow-down]="stats.pagesTranslatedDeltaWeek < 0"></i>
            {{ stats.pagesTranslatedDeltaWeek >= 0 ? '+' : '' }}{{ stats.pagesTranslatedDeltaWeek }} this week
          </div>
        </div>
        <div class="card">
          <div class="card-eyebrow">Pending review</div>
          <div class="text-3xl font-mono font-bold text-warning mt-1 mb-2">{{ stats.pendingReview | number }}</div>
          <div class="text-xs font-medium" [class.text-success]="stats.pendingReviewDelta <= 0" [class.text-error]="stats.pendingReviewDelta > 0">
            <i class="pi text-[10px] mr-1" [class.pi-arrow-up]="stats.pendingReviewDelta > 0" [class.pi-arrow-down]="stats.pendingReviewDelta <= 0"></i>
            {{ stats.pendingReviewDelta > 0 ? '+' : '' }}{{ stats.pendingReviewDelta }} since last week
          </div>
        </div>
        <div class="card">
          <div class="card-eyebrow">Avg quality</div>
          <div class="text-3xl font-mono font-bold mt-1 mb-2"
               [class.text-success]="stats.avgQuality >= 80"
               [class.text-warning]="stats.avgQuality >= 60 && stats.avgQuality < 80"
               [class.text-error]="stats.avgQuality < 60">
            {{ stats.avgQuality }}%
          </div>
          <div class="text-xs font-medium" [class.text-success]="stats.avgQualityDelta >= 0" [class.text-error]="stats.avgQualityDelta < 0">
            <i class="pi text-[10px] mr-1" [class.pi-arrow-up]="stats.avgQualityDelta >= 0" [class.pi-arrow-down]="stats.avgQualityDelta < 0"></i>
            {{ stats.avgQualityDelta >= 0 ? '+' : '' }}{{ stats.avgQualityDelta }}pts
          </div>
        </div>
      </div>
      <ng-template #statsSkeleton>
        <div class="grid--4 mb-8">
          <div class="card animate-pulse h-24 bg-surface-2"></div>
          <div class="card animate-pulse h-24 bg-surface-2"></div>
          <div class="card animate-pulse h-24 bg-surface-2"></div>
          <div class="card animate-pulse h-24 bg-surface-2"></div>
        </div>
      </ng-template>

      <div class="grid--2">
        <!-- Throughput -->
        <div class="card col h-80 flex flex-col">
          <div class="card-header">
            <h3 class="card-title">Throughput · last 12 weeks</h3>
            <div class="row gap-2">
              <span (click)="setMetric('pages')" class="page-pill !py-1 !px-3 !w-auto text-xs font-semibold cursor-pointer"
                    [class.is-active]="metric === 'pages'">Pages</span>
              <span (click)="setMetric('words')" class="page-pill !py-1 !px-3 !w-auto text-xs font-semibold cursor-pointer text-text-2"
                    [class.is-active]="metric === 'words'">Words</span>
            </div>
          </div>
          <div class="flex-1 flex items-end justify-between px-2 gap-2 mt-4 relative" *ngIf="throughput.length > 0">
            <div *ngFor="let row of throughput; let i = index"
                 class="bg-primary/40 hover:bg-primary transition-colors w-full rounded-t-md relative flex justify-center group"
                 [style.height.%]="throughputMax > 0 ? (row.value / throughputMax) * 100 : 0"
                 [title]="'w' + (i + 1) + ': ' + row.value">
              <span *ngIf="i === 0" class="absolute -bottom-6 text-xs text-text-3 font-mono">w1</span>
              <span *ngIf="i === throughput.length - 1" class="absolute -bottom-6 text-xs text-text-3 font-mono">w{{ throughput.length }}</span>
            </div>
          </div>
          <div class="row row--between mt-8 text-xs text-text-3" *ngIf="throughput.length > 0">
            <span>Total: {{ throughputTotal | number }}</span>
            <span class="mono">peak {{ throughputMax }} · avg {{ throughputAvg }}</span>
          </div>
        </div>

        <!-- My Queue -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">My queue</h3>
            <button pButton icon="pi pi-arrow-right" iconPos="right" label="View all" [text]="true" routerLink="/queue" class="!py-1"></button>
          </div>
          <div class="col gap-1 mt-2">
            <button *ngFor="let q of reviewQueue"
                    [routerLink]="['/review', q.id]"
                    class="page-pill justify-between px-3 py-2.5">
              <div class="row">
                <app-status-dot [status]="q.status"></app-status-dot>
                <span class="text-text-1 font-medium">P{{ q.pageNumber }}</span>
                <span class="dim">·</span>
                <span class="muted ellipsis max-w-[140px] text-sm">{{ q.project?.name }}</span>
              </div>
              <div class="row gap-3">
                <app-priority-pill [level]="q.priority"></app-priority-pill>
              </div>
            </button>
            <div *ngIf="reviewQueue.length === 0 && !loadingQueue" class="py-8 text-center text-text-3 text-sm">
              No pages assigned to you.
            </div>
          </div>
        </div>

        <!-- Recent Projects -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent projects</h3>
            <button pButton icon="pi pi-arrow-right" iconPos="right" label="View all" [text]="true" routerLink="/projects" class="!py-1"></button>
          </div>
          <div class="col gap-5 mt-2">
            <div *ngFor="let p of recentProjects" [routerLink]="['/projects', p.id]" class="cursor-pointer group">
              <div class="row row--between mb-2">
                <span class="font-medium text-text-1 group-hover:text-primary transition-colors">{{ p.name }}</span>
                <span class="mono dim text-xs">{{ p.progress ?? 0 }}%</span>
              </div>
              <p-progressBar [value]="p.progress ?? 0" [showValue]="false"></p-progressBar>
            </div>
            <div *ngIf="recentProjects.length === 0 && !loadingProjects" class="py-4 text-center text-text-3 text-sm">
              No projects yet.
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent activity</h3>
          </div>
          <div class="col gap-4 mt-2">
            <a *ngFor="let a of activity"
               [routerLink]="a.entityHref ?? null"
               class="row items-start gap-3 no-underline hover:opacity-80 transition-opacity">
              <p-avatar [label]="initials(a.user?.name)" shape="circle" class="mt-0.5 shrink-0"></p-avatar>
              <div class="flex-1 min-w-0">
                <div class="text-sm">
                  <strong class="text-text-1">{{ a.user?.name }}</strong>
                  <span class="muted mx-1">{{ a.action }}</span>
                  <span class="text-text-2">{{ a.entityType }}</span>
                </div>
                <div class="text-xs dim mt-1">{{ relativeTime(a.createdAt) }} ago</div>
              </div>
            </a>
            <div *ngIf="activity.length === 0 && !loadingActivity" class="py-4 text-center text-text-3 text-sm">
              No recent activity.
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  stats: DashboardStats | null = null;
  recentProjects: Project[] = [];
  reviewQueue: Page[] = [];
  throughput: { week: string; value: number }[] = [];
  activity: ActivityLog[] = [];
  metric: 'pages' | 'words' = 'pages';

  loadingQueue = true;
  loadingProjects = true;
  loadingActivity = true;

  get greetingText(): string {
    const user = this.auth.user();
    return user ? greeting(user.name) : 'Dashboard';
  }

  get lastSync(): string {
    return relativeTime(this.stats?.lastSyncAt ?? null);
  }

  get throughputMax(): number {
    return this.throughput.reduce((m, r) => Math.max(m, r.value), 0);
  }

  get throughputTotal(): number {
    return this.throughput.reduce((sum, r) => sum + r.value, 0);
  }

  get throughputAvg(): number {
    return this.throughput.length ? Math.round(this.throughputTotal / this.throughput.length) : 0;
  }

  relativeTime = relativeTime;

  initials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  ngOnInit() {
    this.loadThroughput();
    this.loadActivity();
    this.loadQueue();
    this.loadProjects();

    interval(30_000).pipe(
      startWith(0),
      switchMap(() => this.api.getDashboardStats()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({ next: (s) => (this.stats = s), error: () => {} });
  }

  setMetric(m: 'pages' | 'words') {
    if (this.metric === m) return;
    this.metric = m;
    this.loadThroughput();
  }

  private loadThroughput() {
    this.api.getDashboardThroughput(this.metric, 12).subscribe({
      next: (t) => (this.throughput = t),
      error: () => {},
    });
  }

  private loadActivity() {
    this.api.getActivityFeed(10).subscribe({
      next: (a) => { this.activity = a; this.loadingActivity = false; },
      error: () => { this.loadingActivity = false; },
    });
  }

  private loadQueue() {
    this.api.getMyQueue(5).subscribe({
      next: (p) => { this.reviewQueue = p; this.loadingQueue = false; },
      error: () => { this.loadingQueue = false; },
    });
  }

  private loadProjects() {
    this.api.getRecentProjects(4).subscribe({
      next: (p) => { this.recentProjects = p; this.loadingProjects = false; },
      error: () => { this.loadingProjects = false; },
    });
  }
}
