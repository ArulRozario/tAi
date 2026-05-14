import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MenuItem, MessageService } from 'primeng/api';
import { PageThumbnailComponent } from '../../shared/components/page-thumbnail/page-thumbnail.component';
import { ModelPickerComponent } from '../../shared/components/model-picker/model-picker.component';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProjectService, Project, Page } from '../projects.service';

const ACTIVE_STATUSES = new Set(['PENDING', 'RENDERING', 'TRANSLATING', 'REVIEWING']);

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    ButtonModule, SplitButtonModule, ProgressBarModule, CardModule,
    PageThumbnailComponent, ModelPickerComponent,
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private messageService = inject(MessageService);

  project = signal<Project | null>(null);
  loadError = signal<string | null>(null);
  projectId = signal<string | null>(null);
  selectedModel = signal('');
  translationState = signal<'idle' | 'running' | 'paused'>('idle');
  isReviewing = signal(false);

  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  exportItems: MenuItem[] = [
    { label: 'Export as DOCX', icon: 'pi pi-file-word', command: () => this.exportProject('docx') },
    { label: 'Export as Text', icon: 'pi pi-file', command: () => this.exportProject('text') },
    { label: 'Export as HTML', icon: 'pi pi-code', command: () => this.exportProject('html') },
  ];

  get pages(): Page[] { return this.project()?.pages ?? []; }
  get hasPages(): boolean { return this.pages.length > 0; }

  get canTranslate(): boolean {
    return this.translationState() === 'idle' &&
      this.pages.some(p => p.status === 'READY' || p.status === 'TRANSLATION_ERROR');
  }

  get translationDone(): number {
    return this.pages.filter(p => ['TRANSLATED', 'HUMAN_REVIEW', 'APPROVED'].includes(p.status)).length;
  }

  get translationTotal(): number {
    return this.pages.filter(p => !['PENDING', 'RENDERING', 'READY', 'TRANSLATION_ERROR'].includes(p.status)).length;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectId.set(id);
      this.loadProject();
    }
  }

  loadProject() {
    const id = this.projectId()!;
    this.projectService.getProject(id).subscribe({
      next: (p) => {
        this.project.set(p);
        this.loadError.set(null);
        const isTranslating = p.pages?.some(pg => pg.status === 'TRANSLATING') ?? false;
        if (isTranslating && this.translationState() === 'idle') {
          this.translationState.set('running');
        } else if (!isTranslating && this.translationState() === 'running') {
          this.translationState.set('idle');
        }
        this.schedulePoll(p);
      },
      error: (err) => this.loadError.set(err?.error?.message || 'Failed to load project.'),
    });
  }

  private schedulePoll(p: Project) {
    this.clearPoll();
    if (this.shouldPoll(p)) {
      this.pollTimer = setTimeout(() => this.loadProject(), 2000);
    }
  }

  private shouldPoll(p: Project): boolean {
    if (p.status === 'PROCESSING') return true;
    return p.pages?.some(pg => ACTIVE_STATUSES.has(pg.status)) ?? false;
  }

  private clearPoll() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  startTranslation() {
    const id = this.projectId();
    if (!id) return;
    this.projectService.startTranslation(id, this.selectedModel() || undefined).subscribe({
      next: (res) => {
        if (res.jobCount === 0) {
          this.messageService.add({ severity: 'info', summary: 'Nothing to translate', detail: 'No pages are ready for translation.' });
          return;
        }
        this.translationState.set('running');
        // Force immediate poll to pick up TRANSLATING pages
        this.clearPoll();
        this.pollTimer = setTimeout(() => this.loadProject(), 500);
      },
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to start translation.' }),
    });
  }

  pauseTranslation() {
    const id = this.projectId();
    if (!id) return;
    this.projectService.pauseProject(id).subscribe({
      next: () => this.translationState.set('paused'),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to pause.' }),
    });
  }

  resumeTranslation() {
    const id = this.projectId();
    if (!id) return;
    this.projectService.resumeProject(id).subscribe({
      next: () => {
        this.translationState.set('running');
        this.clearPoll();
        this.pollTimer = setTimeout(() => this.loadProject(), 500);
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to resume.' }),
    });
  }

  stopTranslation() {
    const id = this.projectId();
    if (!id) return;
    this.projectService.cancelProjectJobs(id).subscribe({
      next: () => {
        this.translationState.set('idle');
        this.loadProject();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to stop.' }),
    });
  }

  startReview() {
    const id = this.projectId();
    if (!id) return;
    this.isReviewing.set(true);
    this.projectService.reviewProject(id, this.selectedModel() || undefined).subscribe({
      next: () => {
        this.isReviewing.set(false);
        this.messageService.add({ severity: 'success', summary: 'Review queued', detail: 'AI review has been queued.' });
        if (this.project()) this.schedulePoll(this.project()!);
      },
      error: (err) => {
        this.isReviewing.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to queue review.' });
      },
    });
  }

  navigateToWorkbench(pageId: string) {
    this.router.navigate(['/workbench', pageId]);
  }

  exportProject(format: string) {
    const id = this.projectId();
    if (!id) return;
    const name = this.project()?.name || 'export';
    this.projectService.exportProject(id, format as any).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.${format === 'text' ? 'txt' : format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.messageService.add({ severity: 'success', summary: 'Export complete', detail: `Exported as ${format.toUpperCase()}.` });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Export failed', detail: `Failed to export as ${format.toUpperCase()}.` }),
    });
  }

  onDeleteProject() {
    const id = this.projectId();
    if (!id) return;
    const name = this.project()?.name || 'this project';
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    this.projectService.deleteProject(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `"${name}" has been removed.` });
        this.router.navigate(['/projects']);
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete project.' }),
    });
  }

  ngOnDestroy() {
    this.clearPoll();
  }
}
