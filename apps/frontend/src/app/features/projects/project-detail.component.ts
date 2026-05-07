import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService, Project, Chapter, Page, ProjectStats } from '../../core/services/api.service';
import { QualityRingComponent } from '../../shared/ui/quality-ring/quality-ring.component';
import { forkJoin } from 'rxjs';

interface ChapterWithPages extends Chapter {
  pages: Page[];
  expanded: boolean;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, ProgressBarModule, AvatarModule,
            SplitButtonModule, TagModule, ToastModule, QualityRingComponent],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="page fade-in" *ngIf="project">
      <!-- Breadcrumb + actions -->
      <div class="page-header items-start">
        <div>
          <div class="row gap-2 text-sm text-text-3 mb-2">
            <a routerLink="/projects" class="hover:text-text-2 transition-colors no-underline text-text-3">← Projects</a>
            <span>/</span>
            <span class="text-text-2">{{ project.name }}</span>
          </div>
          <h1 class="page-title mb-1">{{ project.name }}</h1>
          <p class="page-subtitle">
            {{ project.sourceLang | uppercase }} → {{ project.targetLang | uppercase }}
            <ng-container *ngIf="project.genre"> · {{ project.genre.name }}</ng-container>
            <ng-container *ngIf="stats"> · {{ stats.total }} pages</ng-container>
            <ng-container *ngIf="chapters.length"> · {{ chapters.length }} chapters</ng-container>
          </p>
        </div>
        <div class="row gap-2 mt-1">
          <button pButton [label]="project.status === 'PAUSED' ? 'Resume ▶' : 'Pause ⏸'"
                  [text]="true" severity="secondary"
                  class="!bg-surface-2 !border !border-border"
                  (click)="togglePause()"></button>
          <p-splitButton label="Export PDF" icon="pi pi-download"
                         [model]="exportItems" severity="secondary"
                         styleClass="!bg-surface-2 !border-border"></p-splitButton>
          <button pButton label="Open workbench" icon="pi pi-arrow-right" iconPos="right"
                  severity="primary" (click)="openWorkbench()"
                  [disabled]="!firstOpenPage"></button>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="grid--4 mb-8" *ngIf="stats">
        <div class="card">
          <div class="card-eyebrow">Approved</div>
          <div class="text-3xl font-mono font-bold text-success mt-1 mb-3">{{ stats.approved }}</div>
          <p-progressBar [value]="stats.total > 0 ? (stats.approved / stats.total) * 100 : 0"
                         [showValue]="false" styleClass="!h-1.5"></p-progressBar>
        </div>
        <div class="card">
          <div class="card-eyebrow">In review</div>
          <div class="text-3xl font-mono font-bold text-warning mt-1 mb-3">{{ stats.humanReview }}</div>
          <p-progressBar [value]="stats.total > 0 ? (stats.humanReview / stats.total) * 100 : 0"
                         [showValue]="false" styleClass="!h-1.5"></p-progressBar>
        </div>
        <div class="card">
          <div class="card-eyebrow">Pending</div>
          <div class="text-3xl font-mono font-bold mt-1 mb-3">{{ pendingCount }}</div>
          <p-progressBar [value]="stats.total > 0 ? (pendingCount / stats.total) * 100 : 0"
                         [showValue]="false" styleClass="!h-1.5"></p-progressBar>
        </div>
        <div class="card">
          <div class="card-eyebrow">Avg quality</div>
          <div class="row gap-3 mt-2 items-center">
            <app-quality-ring [value]="project.avgQuality ?? 0" [size]="64"></app-quality-ring>
            <div>
              <div class="text-2xl font-mono font-bold">{{ project.avgQuality ?? 0 }}%</div>
              <div class="text-xs text-text-3 mt-0.5">across {{ stats.approved }} approved</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chapters + Page grid -->
      <div class="grid grid-cols-2 gap-6">
        <!-- Chapters accordion -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Chapters</h3>
          </div>
          <div class="col gap-1" *ngIf="chapters.length > 0; else noChapters">
            <div *ngFor="let ch of chapters" class="rounded-lg overflow-hidden">
              <button (click)="selectChapter(ch)"
                      class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-surface-2 text-left"
                      [class.bg-surface-2]="selectedChapter?.id === ch.id">
                <i class="pi pi-chevron-right text-text-3 text-xs transition-transform"
                   [class.rotate-90]="selectedChapter?.id === ch.id"></i>
                <span class="font-medium text-text-1 flex-1 text-sm">Chapter {{ ch.number }}<ng-container *ngIf="ch.title"> · {{ ch.title }}</ng-container></span>
                <span class="font-mono text-xs text-text-3">{{ ch.pages.length }}p</span>
                <div class="w-20">
                  <p-progressBar [value]="chapterProgress(ch)" [showValue]="false" styleClass="!h-1"></p-progressBar>
                </div>
                <span class="font-mono text-xs text-text-3 w-10 text-right">{{ approvedInChapter(ch) }}/{{ ch.pages.length }}</span>
                <span class="text-xs px-2 py-0.5 rounded font-semibold"
                      [ngClass]="chapterStatusClass(ch)">{{ chapterStatusLabel(ch) }}</span>
              </button>
            </div>
          </div>
          <ng-template #noChapters>
            <div class="py-8 text-center text-text-3 text-sm">
              <i class="pi pi-inbox text-2xl block mb-2"></i>
              No chapters yet. Upload a document to start processing.
            </div>
          </ng-template>
        </div>

        <!-- Page grid -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              Pages
              <ng-container *ngIf="selectedChapter"> · Chapter {{ selectedChapter.number }}</ng-container>
            </h3>
            <span class="text-xs text-text-3">Click to open</span>
          </div>
          <div *ngIf="selectedChapter; else noChapterSelected">
            <div class="flex flex-wrap gap-2">
              <button *ngFor="let p of selectedChapter.pages"
                      (click)="goToPage(p)"
                      class="w-10 h-10 rounded-md flex items-center justify-center text-xs font-mono font-medium transition-colors hover:opacity-80"
                      [title]="'P' + p.pageNumber + ' · ' + p.status"
                      [ngClass]="pageGridClass(p)">
                {{ p.pageNumber }}
              </button>
            </div>
            <div class="row gap-4 mt-4 text-xs text-text-3 flex-wrap">
              <div class="row gap-1.5"><span class="w-3 h-3 rounded-sm bg-success inline-block"></span> Approved</div>
              <div class="row gap-1.5"><span class="w-3 h-3 rounded-sm bg-warning inline-block"></span> In review</div>
              <div class="row gap-1.5"><span class="w-3 h-3 rounded-sm bg-surface-2 border border-border inline-block"></span> Pending</div>
              <div class="row gap-1.5"><span class="w-3 h-3 rounded-sm bg-error inline-block"></span> Changes</div>
              <div class="row gap-1.5"><span class="w-3 h-3 rounded-sm bg-primary inline-block"></span> Processing</div>
            </div>
          </div>
          <ng-template #noChapterSelected>
            <div class="py-8 text-center text-text-3 text-sm">
              Select a chapter to see its pages.
            </div>
          </ng-template>
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div class="page" *ngIf="!project && loading">
      <div class="animate-pulse space-y-4">
        <div class="h-8 bg-surface-2 rounded w-64"></div>
        <div class="h-4 bg-surface-2 rounded w-96"></div>
        <div class="grid--4 mt-8">
          <div *ngFor="let _ of [0,1,2,3]" class="card h-28 bg-surface-2"></div>
        </div>
      </div>
    </div>
  `
})
export class ProjectDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(MessageService);

  project: Project | null = null;
  stats: ProjectStats | null = null;
  chapters: ChapterWithPages[] = [];
  selectedChapter: ChapterWithPages | null = null;
  allPages: Page[] = [];
  loading = true;

  exportItems = [
    { label: 'Export as DOCX', icon: 'pi pi-file-word', command: () => this.export('docx') },
    { label: 'Export as Text', icon: 'pi pi-file', command: () => this.export('text') },
    { label: 'Export as HTML', icon: 'pi pi-code', command: () => this.export('html') },
  ];

  get pendingCount(): number {
    if (!this.stats) return 0;
    return this.stats.pending + this.stats.extracting + this.stats.extracted +
           this.stats.translating + this.stats.translated + this.stats.reviewing;
  }

  get firstOpenPage(): Page | undefined {
    return this.allPages.find(p => p.status !== 'APPROVED');
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    forkJoin([
      this.api.getProject(id),
      this.api.getProjectStats(id),
      this.api.getChapters(id),
      this.api.getPages(id, undefined, undefined, 500),
    ]).subscribe({
      next: ([project, stats, chapters, pagesResult]) => {
        this.project = project;
        this.stats = stats;
        this.allPages = pagesResult.data;
        this.chapters = chapters.map(ch => ({
          ...ch,
          expanded: false,
          pages: pagesResult.data.filter(p => p.chapterId === ch.id)
            .sort((a, b) => a.pageNumber - b.pageNumber),
        }));
        if (this.chapters.length > 0) this.selectedChapter = this.chapters[0];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  selectChapter(ch: ChapterWithPages) {
    this.selectedChapter = ch;
  }

  goToPage(page: Page) {
    this.router.navigate(['/workbench', page.id]);
  }

  openWorkbench() {
    const page = this.firstOpenPage ?? this.allPages[0];
    if (page) this.router.navigate(['/workbench', page.id]);
  }

  togglePause() {
    if (!this.project) return;
    const isPaused = this.project.status === 'PAUSED';
    const action$ = isPaused ? this.api.resumeProject(this.project.id) : this.api.pauseProject(this.project.id);
    action$.subscribe({
      next: () => {
        this.project!.status = isPaused ? 'PROCESSING' : 'PAUSED';
        this.toast.add({ severity: 'success', summary: isPaused ? 'Project resumed' : 'Project paused', life: 3000 });
      },
      error: () => this.toast.add({ severity: 'error', summary: 'Action failed', life: 3000 }),
    });
  }

  export(format: string) {
    if (!this.project) return;
    this.api.exportProject(this.project.id, format, 'approved').subscribe({
      next: ({ jobId }) => this.toast.add({
        severity: 'info', summary: 'Export started', detail: `Job ${jobId} queued. Check back shortly.`, life: 5000,
      }),
      error: () => this.toast.add({ severity: 'error', summary: 'Export failed', life: 3000 }),
    });
  }

  chapterProgress(ch: ChapterWithPages): number {
    if (!ch.pages.length) return 0;
    return Math.round((ch.pages.filter(p => p.status === 'APPROVED').length / ch.pages.length) * 100);
  }

  approvedInChapter(ch: ChapterWithPages): number {
    return ch.pages.filter(p => p.status === 'APPROVED').length;
  }

  chapterStatusLabel(ch: ChapterWithPages): string {
    const progress = this.chapterProgress(ch);
    if (progress === 100) return 'Done';
    if (progress > 0) return 'In progress';
    const hasActive = ch.pages.some(p => ['PROCESSING', 'TRANSLATING', 'REVIEWING', 'HUMAN_REVIEW'].includes(p.status));
    if (hasActive) return 'Active';
    return 'Queued';
  }

  chapterStatusClass(ch: ChapterWithPages): string {
    const label = this.chapterStatusLabel(ch);
    switch (label) {
      case 'Done': return 'bg-success/20 text-success';
      case 'In progress': return 'bg-primary/20 text-primary';
      case 'Active': return 'bg-warning/20 text-warning';
      default: return 'bg-surface-2 text-text-3';
    }
  }

  pageGridClass(page: Page): string {
    switch (page.status) {
      case 'APPROVED': return 'bg-success/20 text-success border border-success/30';
      case 'HUMAN_REVIEW': return 'bg-warning/20 text-warning border border-warning/30';
      case 'REJECTED': return 'bg-error/20 text-error border border-error/30';
      case 'TRANSLATING':
      case 'REVIEWING':
      case 'PROCESSING':
      case 'EXTRACTING': return 'bg-primary/20 text-primary border border-primary/30 animate-pulse';
      default: return 'bg-surface-2 text-text-3 border border-border';
    }
  }
}
