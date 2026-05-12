import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { faro } from '@grafana/faro-web-sdk';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { MenuItem, MessageService } from 'primeng/api';
import { QualityGaugeComponent } from '../../shared/components/quality-gauge/quality-gauge.component';
import { PageThumbnailComponent } from '../../shared/components/page-thumbnail/page-thumbnail.component';
import { ModelPickerComponent } from '../../shared/components/model-picker/model-picker.component';
import { CardModule } from 'primeng/card';
import { ProjectService, Project, Chapter, ProjectStats, Page } from '../projects.service';

interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
  status: 'extracting' | 'complete' | 'error';
  pageId?: string;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TagModule,
    AvatarModule,
    ProgressBarModule,
    SplitButtonModule,
    TooltipModule,
    SelectModule,
    FormsModule,
    QualityGaugeComponent,
    PageThumbnailComponent,
    ModelPickerComponent,
    CardModule,
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private messageService = inject(MessageService);

  projectId = signal<string | null>(null);
  project = signal<Project | null>(null);
  chapters = signal<Chapter[]>([]);
  stats = signal<ProjectStats | null>(null);
  loading = signal(true);

  // ─── Extraction State ──────────────────────────────────────
  isExtracting = signal(false);
  extractionProgress = signal<ExtractionProgress | null>(null);
  extractionError = signal<string | null>(null);

  // ─── Model Picker State ────────────────────────────────────
  selectedModel = signal<string>('');

  exportItems: MenuItem[] = [
    {
      label: 'Export as DOCX',
      icon: 'pi pi-file-word',
      command: () => this.exportProject('docx'),
    },
    {
      label: 'Export as Text',
      icon: 'pi pi-file',
      command: () => this.exportProject('text'),
    },
    {
      label: 'Export as HTML',
      icon: 'pi pi-code',
      command: () => this.exportProject('html'),
    },
  ];

  genreOptions = signal<{ label: string; value: string }[]>([]);
  selectedGenre = signal<string>('');

  selectedChapterId = signal<string | null>(null);

  selectedChapter = computed(() => {
    const chapters = this.chapters();
    if (chapters.length === 0) return null;
    return chapters.find(c => c.id === this.selectedChapterId()) ?? chapters[0];
  });

  isTranslating = signal(false);
  isReviewing = signal(false);

  chapterPages = computed(() => {
    const ch = this.selectedChapter();
    if (!ch) return [];
    const proj = this.project();
    if (!proj || !proj.pages) return [];
    return proj.pages.filter(p => p.chapterId === ch.id);
  });

  // Fallback for pages without chapters
  orphanPages = computed(() => {
    const proj = this.project();
    if (!proj || !proj.pages) return [];
    return proj.pages.filter(p => !p.chapterId);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectId.set(id);
      this.loadData();
    }
  }

  loadData() {
    const id = this.projectId()!;
    this.loading.set(true);
    this.extractionError.set(null);

    this.projectService.getProject(id).subscribe({
      next: (p) => {
        this.project.set(p);
        if (p.styleGuide) {
          this.genreOptions.set([{ label: p.styleGuide.name, value: p.styleGuide.id }]);
          this.selectedGenre.set(p.styleGuide.id);
        }

        // Set the model picker to the project's saved model
        // model selection is per-operation, not persisted to project

        // Auto-trigger extraction if project has a source file but no pages yet
        const hasNoPages = !p.pages || p.pages.length === 0;
        const hasSourceFile = !!p.sourceFileId;
        if (hasNoPages && hasSourceFile && !this.isExtracting()) {
          this.startExtraction();
        }
      },
      error: (err) => console.error('Failed to load project', err)
    });

    this.projectService.getChapters(id).subscribe({
      next: (ch) => {
        this.chapters.set(ch);
        if (ch.length > 0) {
          this.selectedChapterId.set(ch[0].id);
        }
      },
      error: (err) => console.error('Failed to load chapters', err)
    });

    this.projectService.getStats(id).subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load stats', err);
        this.loading.set(false);
      }
    });
  }

  /**
   * Starts the extraction SSE stream. Renders PDF pages to images and creates
   * PENDING Page records. Progress is streamed in real-time.
   */
  startExtraction() {
    const id = this.projectId();
    if (!id) return;

    this.isExtracting.set(true);
    this.extractionProgress.set({ currentPage: 0, totalPages: 0, status: 'extracting' });
    this.extractionError.set(null);

    const eventSource = new EventSource(`/api/v1/projects/${id}/extract`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Extraction complete
      if (data.message === 'Extraction complete.') {
        this.isExtracting.set(false);
        this.extractionProgress.set({
          currentPage: data.totalPages,
          totalPages: data.totalPages,
          status: 'complete',
        });
        eventSource.close();
        this.loadData(); // Refresh to show page cards
        return;
      }

      // Extraction failed
      if (data.message === 'Extraction failed.') {
        this.isExtracting.set(false);
        this.extractionError.set(data.error || 'Unknown extraction error');
        this.extractionProgress.set({
          currentPage: 0,
          totalPages: 0,
          status: 'error',
        });
        eventSource.close();
        return;
      }

      // Progress update
      if (data.status === 'extracting') {
        this.extractionProgress.set(data as ExtractionProgress);
      }
    };

    eventSource.onerror = (err) => {
      faro.api?.pushError(new Error('Extraction stream interrupted'), { context: { projectId: this.project()?.id ?? '' } });
      this.isExtracting.set(false);
      this.extractionError.set('Connection lost during extraction');
      eventSource.close();
    };
  }

  get approvedPercent(): number {
    const s = this.stats();
    return s && s.totalPages > 0 ? Math.round((s.approved / s.totalPages) * 100) : 0;
  }
  get inReviewPercent(): number {
    const s = this.stats();
    return s && s.totalPages > 0 ? Math.round((s.inReview / s.totalPages) * 100) : 0;
  }
  get pendingPercent(): number {
    const s = this.stats();
    return s && s.totalPages > 0 ? Math.round((s.pending / s.totalPages) * 100) : 0;
  }

  get extractionPercent(): number {
    const p = this.extractionProgress();
    if (!p || p.totalPages === 0) return 0;
    return Math.round((p.currentPage / p.totalPages) * 100);
  }

  getChapterProgress(ch: Chapter): number {
    return 0;
  }

  getChapterTagSeverity(status: string): 'success' | 'warn' | 'secondary' {
    const s = status.toLowerCase();
    if (s === 'done' || s === 'completed') return 'success';
    if (s === 'in-progress' || s === 'processing') return 'warn';
    return 'secondary';
  }

  getChapterTagLabel(status: string): string {
    const s = status.toLowerCase();
    if (s === 'done' || s === 'completed') return 'Done';
    if (s === 'in-progress' || s === 'processing') return 'In progress';
    return 'Queued';
  }

  selectChapter(id: string): void {
    this.selectedChapterId.set(id);
  }

  navigateToWorkbench(pageId: string): void {
    this.router.navigate(['/workbench', pageId]);
  }

  startTranslation() {
    const id = this.projectId();
    if (!id) return;

    this.isTranslating.set(true);
    const model = this.selectedModel();
    const eventSource = new EventSource(`/api/v1/projects/${id}/translate${model ? `?model=${encodeURIComponent(model)}` : ''}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Ignore heartbeats — they just keep the SSE connection alive
      if (data.type === 'heartbeat') {
        return;
      }

      // Initial status / total pages info
      if (data.type === 'status') {
        console.log(`[Translation] ${data.message}`);
        return;
      }

      // Batch started
      if (data.type === 'batch-start') {
        console.log(`[Translation] Batch ${data.batch}/${data.totalBatches} started — pages ${data.pageNumbers?.join(', ')}`);
        return;
      }

      // Page update (translated or error)
      if (data.type === 'page-update' && data.pageNumber && data.status) {
        this.updatePageStatus(data.pageNumber, data.status);
        return;
      }

      // Translation fully completed
      if (data.type === 'completed' || data.message === 'Translation completed.') {
        this.isTranslating.set(false);
        eventSource.close();
        this.loadData();
        return;
      }

      // Quota exceeded — stop immediately so user can switch models
      if (data.type === 'quota-exceeded') {
        this.isTranslating.set(false);
        eventSource.close();
        this.loadData(); // refresh to show ERROR on current batch
        this.messageService.add({
          severity: 'warn',
          summary: 'Quota exceeded',
          detail: 'The selected model has reached its API quota. Please choose a different model and try again.',
          sticky: true,
        });
        return;
      }

      // Fatal error from the backend
      if (data.type === 'fatal-error') {
        faro.api?.pushError(new Error(`Translation fatal error: ${data.error}`), { context: { projectId: this.project()?.id ?? '' } });
        this.isTranslating.set(false);
        eventSource.close();
        this.messageService.add({
          severity: 'error',
          summary: 'Translation failed',
          detail: data.error || 'An unexpected error occurred during translation.',
        });
        return;
      }

      // Legacy fallback for old-style messages
      if (data.message === 'No pages need translation.') {
        this.isTranslating.set(false);
        eventSource.close();
        this.messageService.add({
          severity: 'info',
          summary: 'Nothing to translate',
          detail: 'All pages are already translated or in review.',
        });
        return;
      }
    };

    eventSource.onerror = (err) => {
      faro.api?.pushError(new Error('Translation stream interrupted'), { context: { projectId: this.project()?.id ?? '' } });
      this.isTranslating.set(false);
      eventSource.close();
      this.messageService.add({
        severity: 'error',
        summary: 'Connection lost',
        detail: 'The translation stream was interrupted. Please try again.',
      });
    };
  }

  private updatePageStatus(pageNumber: number, status: string) {
    this.project.update(p => {
      if (!p || !p.pages) return p;
      const updatedPages = p.pages.map(page =>
        page.pageNumber === pageNumber ? { ...page, status } : page
      );
      return { ...p, pages: updatedPages };
    });
  }

  startReview() {
    const id = this.projectId();
    if (!id) return;

    this.isReviewing.set(true);
    this.projectService.reviewProject(id, this.selectedModel() || undefined).subscribe({
      next: (res: any) => {
        this.isReviewing.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'AI Review queued',
          detail: res.message || 'Review job has been queued. Pages will be reviewed in batches.',
        });
        // Poll for job completion
        this.pollReviewJob(res.jobId);
      },
      error: (err) => {
        this.isReviewing.set(false);
        const detail = err?.error?.message || 'Failed to queue AI review.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  private pollReviewJob(jobId: string) {
    const poll = () => {
      this.projectService.getJob(jobId).subscribe({
        next: (job: any) => {
          if (job.status === 'DONE') {
            this.messageService.add({
              severity: 'success',
              summary: 'Review complete',
              detail: 'AI review has finished. Refresh to see updated error counts.',
            });
            this.loadData();
          } else if (job.status === 'FAILED') {
            this.messageService.add({
              severity: 'error',
              summary: 'Review failed',
              detail: job.errorMessage || 'AI review job failed.',
            });
          } else {
            setTimeout(poll, 3000);
          }
        },
        error: () => {
          // Stop polling on error
        },
      });
    };
    setTimeout(poll, 3000);
  }

  exportProject(format: 'pdf' | 'docx' | 'html' | 'text') {
    const id = this.projectId();
    if (!id) return;

    const name = this.project()?.name || 'export';
    this.projectService.exportProject(id, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.${format === 'text' ? 'txt' : format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Export complete',
          detail: `Project exported as ${format.toUpperCase()}.`,
        });
      },
      error: (err) => {
        const detail = err?.error?.message || `Failed to export as ${format.toUpperCase()}.`;
        this.messageService.add({ severity: 'error', summary: 'Export failed', detail });
      },
    });
  }

  onDeleteProject() {
    const id = this.projectId();
    if (!id) return;

    const name = this.project()?.name || 'this project';
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?\n\nThis will permanently remove:\n• All pages and translations\n• All chapters\n• All uploaded files\n• All review data\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    this.projectService.deleteProject(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Project deleted',
          detail: `"${name}" has been permanently removed.`,
        });
        this.router.navigate(['/projects']);
      },
      error: (err) => {
        const detail = err?.error?.message || 'Failed to delete project.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  get initials(): string {
    return this.project()?.owner?.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'RK';
  }
}
