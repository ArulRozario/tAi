import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ApiService, QueuePage, ErrorStat, Escalation } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PriorityPillComponent } from '../../shared/ui/priority-pill/priority-pill.component';
import { StatusDotComponent } from '../../shared/ui/status-dot/status-dot.component';

const SORT_OPTIONS = [
  { label: 'Priority', value: 'priority' },
  { label: 'Quality', value: 'quality' },
  { label: 'Time waiting', value: 'waitTime' },
];

const ERROR_TYPE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Terminology', value: 'TERMINOLOGY' },
  { label: 'Style', value: 'STYLE' },
  { label: 'Accuracy', value: 'ACCURACY' },
  { label: 'Fluency', value: 'FLUENCY' },
];

@Component({
  selector: 'app-review-queue',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TagModule, DialogModule, TextareaModule,
    ProgressBarModule, TooltipModule, SelectModule, SkeletonModule,
    PriorityPillComponent, StatusDotComponent,
  ],
  template: `
    <!-- Resolve escalation dialog -->
    <p-dialog
      [(visible)]="resolveDialogVisible"
      [modal]="true"
      header="Resolve escalation"
      [style]="{ width: '480px' }"
      [draggable]="false"
      styleClass="!bg-surface-1 !border-border">
      <div class="flex flex-col gap-4 py-2">
        <p class="text-sm text-text-2">
          Provide a resolution note for <strong class="text-text-1">P{{ resolveTarget?.chapter?.number ?? '' }}{{ resolveTarget ? resolveTarget.pageId.slice(-4) : '' }}</strong>.
        </p>
        <textarea
          pTextarea
          rows="4"
          [(ngModel)]="resolveNote"
          placeholder="Describe the resolution or override applied…"
          class="w-full !bg-surface-2 !border-border !text-text-1 text-sm resize-none rounded-md p-3">
        </textarea>
      </div>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" [text]="true" (click)="resolveDialogVisible = false"></button>
        <button pButton label="Resolve" severity="primary"
                [disabled]="!resolveNote.trim() || resolving"
                [loading]="resolving"
                (click)="submitResolve()"></button>
      </ng-template>
    </p-dialog>

    <div class="page fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">My queue</h1>
          <p class="page-subtitle" *ngIf="!loading">
            {{ reviewCount() }} pages awaiting review
            <ng-container *ngIf="isMasterOrAdmin() && escalationCount() > 0">
              · {{ escalationCount() }} escalated to master
            </ng-container>
          </p>
        </div>
        <div class="row gap-3">
          <!-- Sort -->
          <p-select
            [options]="sortOptions"
            [(ngModel)]="selectedSort"
            optionLabel="label"
            optionValue="value"
            placeholder="Sort: Priority"
            (onChange)="loadQueue()"
            styleClass="!bg-surface-2 !border-border !text-text-1 !text-sm w-44">
          </p-select>
          <!-- Error type filter -->
          <p-select
            [options]="errorTypeOptions"
            [(ngModel)]="selectedErrorType"
            optionLabel="label"
            optionValue="value"
            placeholder="All error types"
            (onChange)="loadQueue()"
            styleClass="!bg-surface-2 !border-border !text-text-1 !text-sm w-44">
          </p-select>
          <!-- Low quality toggle -->
          <label class="row gap-2 cursor-pointer text-sm text-text-2 select-none">
            <input type="checkbox"
                   [(ngModel)]="lowQualityOnly"
                   (change)="loadQueue()"
                   class="w-4 h-4 rounded border border-border bg-surface-2 accent-primary" />
            Low quality only
          </label>
        </div>
      </div>

      <!-- Queue table -->
      <div class="card !p-0 overflow-hidden mb-6">
        <!-- Loading skeletons -->
        <ng-container *ngIf="loading">
          <div *ngFor="let _ of [1,2,3,4,5]" class="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0">
            <p-skeleton width="3rem" height="1rem"></p-skeleton>
            <p-skeleton width="8rem" height="1rem"></p-skeleton>
            <p-skeleton width="2rem" height="1rem"></p-skeleton>
            <p-skeleton width="6rem" height="1rem"></p-skeleton>
            <p-skeleton width="4rem" height="1rem"></p-skeleton>
            <p-skeleton width="4rem" height="1rem"></p-skeleton>
            <p-skeleton width="3rem" height="1rem"></p-skeleton>
          </div>
        </ng-container>

        <!-- Empty state -->
        <ng-container *ngIf="!loading && pages().length === 0">
          <div class="flex flex-col items-center justify-center py-20 gap-3">
            <i class="pi pi-check-circle text-success text-4xl"></i>
            <p class="text-text-2 text-sm">Your review queue is empty.</p>
          </div>
        </ng-container>

        <!-- Table -->
        <table *ngIf="!loading && pages().length > 0" class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-surface-2">
              <th class="text-left py-3 px-4 text-text-3 font-semibold text-xs uppercase tracking-wider w-16">Page</th>
              <th class="text-left py-3 px-4 text-text-3 font-semibold text-xs uppercase tracking-wider">Project</th>
              <th class="text-center py-3 px-3 text-text-3 font-semibold text-xs uppercase tracking-wider w-10">Ch.</th>
              <th class="text-left py-3 px-4 text-text-3 font-semibold text-xs uppercase tracking-wider w-44">Quality</th>
              <th class="text-left py-3 px-4 text-text-3 font-semibold text-xs uppercase tracking-wider w-28">Errors</th>
              <th class="text-left py-3 px-4 text-text-3 font-semibold text-xs uppercase tracking-wider w-24">Priority</th>
              <th class="text-center py-3 px-3 text-text-3 font-semibold text-xs uppercase tracking-wider w-20">Wait</th>
              <th class="text-left py-3 px-4 text-text-3 font-semibold text-xs uppercase tracking-wider w-28">Status</th>
              <th class="py-3 px-4 w-24"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let page of pages()"
                class="border-b border-border hover:bg-surface-2 cursor-pointer transition-colors last:border-b-0"
                (click)="openReview(page.id)">
              <td class="py-3 px-4 font-mono text-text-2 font-medium">P{{ page.pageNumber }}</td>
              <td class="py-3 px-4">
                <span class="text-text-1 font-medium ellipsis max-w-[180px] block">{{ page.project?.name }}</span>
              </td>
              <td class="py-3 px-3 text-center text-text-2 font-mono">{{ page.chapter?.number ?? '—' }}</td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs w-8 shrink-0"
                        [class.text-error]="(page.quality ?? 0) < 60"
                        [class.text-warning]="(page.quality ?? 0) >= 60 && (page.quality ?? 0) < 80"
                        [class.text-success]="(page.quality ?? 0) >= 80">
                    {{ page.quality != null ? page.quality + '%' : '—' }}
                  </span>
                  <div class="w-16 h-1.5 bg-surface-2 rounded-full overflow-hidden border border-border" *ngIf="page.quality != null">
                    <div class="h-full rounded-full transition-all"
                         [style.width.%]="page.quality"
                         [class.bg-error]="page.quality < 60"
                         [class.bg-warning]="page.quality >= 60 && page.quality < 80"
                         [class.bg-success]="page.quality >= 80">
                    </div>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <p-tag
                  [value]="page.errorCount + ' issue' + (page.errorCount !== 1 ? 's' : '')"
                  [severity]="errorSeverity(page.errorCount)"
                  [rounded]="true">
                </p-tag>
              </td>
              <td class="py-3 px-4">
                <app-priority-pill [level]="page.priority"></app-priority-pill>
              </td>
              <td class="py-3 px-3 text-center text-text-2 font-mono text-xs">
                {{ waitTime(page.assignedAt) }}
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <app-status-dot [status]="page.status"></app-status-dot>
                  <span class="text-text-2 text-xs">{{ statusLabel(page.status) }}</span>
                </div>
              </td>
              <td class="py-3 px-4" (click)="$event.stopPropagation()">
                <button pButton label="Review" icon="pi pi-arrow-right" iconPos="right"
                        severity="primary" size="small"
                        (click)="openReview(page.id)">
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Load more -->
      <div *ngIf="!loading && hasMore()" class="flex justify-center mb-6">
        <button pButton label="Load more" [text]="true" [loading]="loadingMore"
                (click)="loadMore()"></button>
      </div>

      <!-- Bottom section: Error distribution + Needs attention -->
      <div class="grid--2 gap-6">
        <!-- Error distribution -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Error distribution</h2>
            <span class="text-xs text-text-3">across queue · {{ totalErrors() }} issues</span>
          </div>
          <ng-container *ngIf="loadingStats">
            <div *ngFor="let _ of [1,2,3,4]" class="mb-4">
              <p-skeleton height="1.25rem" class="mb-1"></p-skeleton>
              <p-skeleton height="0.375rem"></p-skeleton>
            </div>
          </ng-container>
          <ng-container *ngIf="!loadingStats">
            <div *ngIf="errorStats().length === 0" class="text-text-3 text-sm py-4 text-center">
              No open errors in queue.
            </div>
            <div *ngFor="let stat of errorStats()" class="mb-4">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-sm inline-block"
                        [class.bg-error]="stat.severity === 'CRITICAL' || stat.severity === 'HIGH'"
                        [class.bg-warning]="stat.severity === 'MEDIUM'"
                        [class.bg-text-3]="stat.severity === 'LOW' || !stat.severity">
                  </span>
                  <span class="text-sm text-text-1 font-medium">{{ formatCategory(stat.category) }}</span>
                  <p-tag
                    [value]="stat.severity ? stat.severity.toLowerCase() : 'low'"
                    [severity]="statSeverity(stat.severity)"
                    size="small" [rounded]="true">
                  </p-tag>
                </div>
                <span class="font-mono text-xs text-text-2">{{ stat.count }}</span>
              </div>
              <div class="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden mb-1">
                <div class="h-full rounded-full transition-all"
                     [style.width.%]="(stat.count / maxStatCount()) * 100"
                     [class.bg-error]="stat.severity === 'CRITICAL' || stat.severity === 'HIGH'"
                     [class.bg-warning]="stat.severity === 'MEDIUM'"
                     [class.bg-text-3]="stat.severity === 'LOW' || !stat.severity">
                </div>
              </div>
              <p class="text-xs text-text-3 ellipsis" *ngIf="stat.exampleText">
                "{{ stat.exampleText }}"
              </p>
            </div>
            <!-- Quick filter -->
            <div class="border-t border-border pt-3 mt-3 flex flex-wrap gap-2">
              <span class="text-xs text-text-3 mr-1 self-center">Quick filter:</span>
              <button *ngFor="let opt of errorTypeOptions.slice(1)"
                      (click)="filterByErrorType(opt.value)"
                      class="text-xs px-2 py-0.5 rounded border transition-colors"
                      [class.border-accent]="selectedErrorType === opt.value"
                      [class.text-accent]="selectedErrorType === opt.value"
                      [class.border-border]="selectedErrorType !== opt.value"
                      [class.text-text-3]="selectedErrorType !== opt.value"
                      [class.hover:text-text-2]="selectedErrorType !== opt.value">
                {{ opt.label }}
              </button>
            </div>
          </ng-container>
        </div>

        <!-- Needs attention (MASTER/ADMIN only) -->
        <div class="card" *ngIf="isMasterOrAdmin()">
          <div class="card-header">
            <h2 class="card-title">Needs attention</h2>
            <span class="text-xs text-text-3">Escalated to master reviewer · {{ escalationCount() }} open</span>
          </div>
          <ng-container *ngIf="loadingEscalations">
            <div *ngFor="let _ of [1,2]" class="border border-border rounded-lg p-3 mb-3">
              <p-skeleton height="1rem" class="mb-2"></p-skeleton>
              <p-skeleton height="0.75rem" width="70%"></p-skeleton>
            </div>
          </ng-container>
          <ng-container *ngIf="!loadingEscalations">
            <div *ngIf="escalations().length === 0" class="text-text-3 text-sm py-4 text-center">
              No escalated pages.
            </div>
            <div *ngFor="let esc of escalations()" class="border border-border rounded-lg p-3 mb-3">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-sm font-medium text-text-1">
                  P{{ esc.chapter?.number }}{{ esc.pageId.slice(-3) }} · {{ esc.project?.name }} · Ch. {{ esc.chapter?.number }}
                </span>
                <p-tag *ngIf="esc.errorCategory"
                       [value]="formatCategory(esc.errorCategory)"
                       severity="warn" size="small" [rounded]="true">
                </p-tag>
              </div>
              <p class="text-xs text-text-3 mb-2 line-clamp-2" *ngIf="esc.summary">
                "{{ esc.summary }}"
              </p>
              <div class="flex items-center justify-between">
                <span class="text-xs text-text-3">
                  Escalated {{ timeAgo(esc.escalatedAt) }}
                </span>
                <button pButton label="Resolve" size="small" severity="primary"
                        (click)="openResolve(esc)">
                </button>
              </div>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
})
export class ReviewQueueComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly sortOptions = SORT_OPTIONS;
  readonly errorTypeOptions = ERROR_TYPE_OPTIONS;

  pages = signal<QueuePage[]>([]);
  errorStats = signal<ErrorStat[]>([]);
  escalations = signal<Escalation[]>([]);

  loading = true;
  loadingMore = false;
  loadingStats = true;
  loadingEscalations = false;

  selectedSort = 'priority';
  selectedErrorType = '';
  lowQualityOnly = false;

  offset = 0;
  total = 0;
  limit = 25;

  resolveDialogVisible = false;
  resolveTarget: Escalation | null = null;
  resolveNote = '';
  resolving = false;

  reviewCount = computed(() => this.pages().filter(p => p.status === 'HUMAN_REVIEW').length);
  escalationCount = computed(() => this.escalations().length);
  hasMore = computed(() => this.pages().length < this.total);
  totalErrors = computed(() => this.errorStats().reduce((sum, s) => sum + s.count, 0));
  maxStatCount = computed(() => Math.max(1, ...this.errorStats().map(s => s.count)));

  isMasterOrAdmin = computed(() => this.auth.hasRole('MASTER', 'ADMIN'));

  ngOnInit() {
    this.loadQueue();
    this.loadStats();
    if (this.isMasterOrAdmin()) {
      this.loadEscalations();
    }
  }

  loadQueue() {
    this.loading = true;
    this.offset = 0;
    const params: Record<string, string> = {
      sort: this.selectedSort,
      limit: String(this.limit),
      offset: '0',
    };
    if (this.selectedErrorType) params['errorTypes'] = this.selectedErrorType;
    if (this.lowQualityOnly) params['lowQualityOnly'] = 'true';

    this.api.getQueue(params).subscribe({
      next: (res) => {
        this.pages.set(res.data);
        this.total = res.total;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadMore() {
    this.loadingMore = true;
    this.offset += this.limit;
    const params: Record<string, string> = {
      sort: this.selectedSort,
      limit: String(this.limit),
      offset: String(this.offset),
    };
    if (this.selectedErrorType) params['errorTypes'] = this.selectedErrorType;
    if (this.lowQualityOnly) params['lowQualityOnly'] = 'true';

    this.api.getQueue(params).subscribe({
      next: (res) => {
        this.pages.update(existing => [...existing, ...res.data]);
        this.total = res.total;
        this.loadingMore = false;
      },
      error: () => { this.loadingMore = false; },
    });
  }

  loadStats() {
    this.loadingStats = true;
    this.api.getQueueErrorStats().subscribe({
      next: (stats) => {
        this.errorStats.set(stats.sort((a, b) => b.count - a.count));
        this.loadingStats = false;
      },
      error: () => { this.loadingStats = false; },
    });
  }

  loadEscalations() {
    this.loadingEscalations = true;
    this.api.getEscalations().subscribe({
      next: (data) => {
        this.escalations.set(data);
        this.loadingEscalations = false;
      },
      error: () => { this.loadingEscalations = false; },
    });
  }

  openReview(pageId: string) {
    this.router.navigate(['/review', pageId]);
  }

  filterByErrorType(value: string) {
    this.selectedErrorType = this.selectedErrorType === value ? '' : value;
    this.loadQueue();
  }

  openResolve(esc: Escalation) {
    this.resolveTarget = esc;
    this.resolveNote = '';
    this.resolveDialogVisible = true;
  }

  submitResolve() {
    if (!this.resolveTarget || !this.resolveNote.trim()) return;
    this.resolving = true;
    this.api.resolveEscalation(this.resolveTarget.pageId, this.resolveNote.trim()).subscribe({
      next: () => {
        this.resolveDialogVisible = false;
        this.resolving = false;
        this.resolveNote = '';
        this.loadEscalations();
        this.loadQueue();
      },
      error: () => { this.resolving = false; },
    });
  }

  errorSeverity(count: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (count > 8) return 'danger';
    if (count > 4) return 'warn';
    if (count === 0) return 'secondary';
    return 'info';
  }

  statSeverity(severity: string | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warn';
      case 'LOW': return 'info';
      default: return 'secondary';
    }
  }

  statusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'HUMAN_REVIEW': return 'Review';
      case 'ESCALATED': return 'Escalated';
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Changes';
      default: return status ?? '';
    }
  }

  formatCategory(cat: string): string {
    if (!cat) return '';
    return cat.charAt(0) + cat.slice(1).toLowerCase().replace(/_/g, ' ');
  }

  waitTime(assignedAt: string | undefined): string {
    if (!assignedAt) return '—';
    const diff = Date.now() - new Date(assignedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + 'm';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h';
    return Math.floor(hrs / 24) + 'd';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }
}
