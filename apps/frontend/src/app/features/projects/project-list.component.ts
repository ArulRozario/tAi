import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ApiService, Project } from '../../core/services/api.service';
import { ProjectCreateDialogComponent } from './project-create.dialog';

type StatusFilter = 'All' | 'New' | 'Active' | 'Paused' | 'Complete';

const STATUS_FILTER_MAP: Record<StatusFilter, string[]> = {
  All: [],
  New: ['DRAFT'],
  Active: ['PROCESSING', 'REVIEW'],
  Paused: ['PAUSED'],
  Complete: ['COMPLETED'],
};

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule,
    TagModule, AvatarModule, ProgressBarModule, ConfirmDialogModule, ToastModule,
    ProjectCreateDialogComponent,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    <app-project-create-dialog [(visible)]="showCreate"></app-project-create-dialog>

    <div class="page fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Projects</h1>
          <p class="page-subtitle" *ngIf="!loading">{{ projects.length }} projects</p>
        </div>
        <div class="row gap-3">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input pInputText [(ngModel)]="search" placeholder="Search projects"
                   class="!bg-surface-2 !border-border !text-text-1 !w-64" />
          </span>
          <button pButton icon="pi pi-plus" label="New project" severity="primary" (click)="showCreate = true"></button>
        </div>
      </div>

      <!-- Status tabs -->
      <div class="row gap-1 mb-6">
        <button *ngFor="let tab of statusTabs"
                (click)="activeTab = tab"
                class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                [class.bg-surface-2]="activeTab === tab"
                [class.text-text-1]="activeTab === tab"
                [class.text-text-3]="activeTab !== tab"
                [class.hover:text-text-2]="activeTab !== tab">
          {{ tab }}
        </button>
      </div>

      <!-- Table -->
      <div class="card !p-0 overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-surface-2/50">
              <th class="text-left py-3 px-4 text-text-3 font-semibold text-xs uppercase tracking-wider">Project</th>
              <th class="text-center py-3 px-3 text-text-3 font-semibold text-xs uppercase tracking-wider w-10">Ch</th>
              <th class="text-center py-3 px-3 text-text-3 font-semibold text-xs uppercase tracking-wider w-16">Pages</th>
              <th class="text-left py-3 px-4 text-text-3 font-semibold text-xs uppercase tracking-wider w-44">Progress</th>
              <th class="text-center py-3 px-3 text-text-3 font-semibold text-xs uppercase tracking-wider w-16">Quality</th>
              <th class="text-left py-3 px-4 text-text-3 font-semibold text-xs uppercase tracking-wider w-28">Status</th>
              <th class="text-center py-3 px-3 text-text-3 font-semibold text-xs uppercase tracking-wider w-12">Owner</th>
              <th class="text-center py-3 px-4 text-text-3 font-semibold text-xs uppercase tracking-wider w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngIf="!loading">
              <tr *ngFor="let p of filtered" (click)="openProject(p.id)"
                  class="border-b border-border/50 hover:bg-surface-2/40 transition-colors cursor-pointer group">
                <td class="py-3 px-4">
                  <div class="font-medium text-text-1">{{ p.name }}</div>
                  <div class="text-xs text-text-3 mt-0.5">{{ p.sourceLang | uppercase }} → {{ p.targetLang | uppercase }}
                    <ng-container *ngIf="p.genre"> · {{ p.genre.name }}</ng-container>
                  </div>
                </td>
                <td class="py-3 px-3 text-center font-mono text-text-2">—</td>
                <td class="py-3 px-3 text-center font-mono text-text-2">{{ p.pageCount ?? 0 }}</td>
                <td class="py-3 px-4">
                  <div class="row gap-2 items-center">
                    <div class="flex-1">
                      <p-progressBar [value]="p.progress ?? 0" [showValue]="false" styleClass="!h-1.5"></p-progressBar>
                    </div>
                    <span class="font-mono text-xs text-text-3 w-8 text-right">{{ p.progress ?? 0 }}%</span>
                  </div>
                </td>
                <td class="py-3 px-3 text-center font-mono text-sm"
                    [class.text-success]="(p.avgQuality ?? 0) >= 80"
                    [class.text-warning]="(p.avgQuality ?? 0) >= 60 && (p.avgQuality ?? 0) < 80"
                    [class.text-error]="(p.avgQuality ?? 0) > 0 && (p.avgQuality ?? 0) < 60"
                    [class.text-text-3]="!p.avgQuality">
                  {{ p.avgQuality ? p.avgQuality + '%' : '—' }}
                </td>
                <td class="py-3 px-4">
                  <span class="px-2 py-0.5 rounded text-xs font-semibold"
                        [ngClass]="statusChipClass(p.status)">
                    {{ statusLabel(p.status) }}
                  </span>
                </td>
                <td class="py-3 px-3 text-center">
                  <p-avatar *ngIf="p.owner" [label]="initials(p.owner.name)" shape="circle" size="normal"></p-avatar>
                </td>
                <td class="py-3 px-4" (click)="$event.stopPropagation()">
                  <div class="row gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button pButton icon="pi pi-pencil" [text]="true" [rounded]="true" severity="secondary"
                            class="!h-7 !w-7" title="Edit" (click)="editProject(p)"></button>
                    <button pButton [icon]="p.status === 'PAUSED' ? 'pi pi-play' : 'pi pi-pause'"
                            [text]="true" [rounded]="true" severity="secondary"
                            class="!h-7 !w-7" [title]="p.status === 'PAUSED' ? 'Resume' : 'Pause'"
                            (click)="togglePause(p)"></button>
                    <button pButton icon="pi pi-stop-circle" [text]="true" [rounded]="true" severity="secondary"
                            class="!h-7 !w-7" title="Cancel jobs" (click)="cancelJobs(p)"></button>
                    <button pButton icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger"
                            class="!h-7 !w-7" title="Delete" (click)="deleteProject(p)"></button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filtered.length === 0">
                <td colspan="8" class="py-16 text-center text-text-3">
                  <i class="pi pi-folder-open text-4xl block mb-3"></i>
                  <div class="font-medium">No projects found</div>
                  <div class="text-sm mt-1">
                    <span *ngIf="search">No results for "{{ search }}" · </span>
                    <button pButton label="Create one" [text]="true" class="!p-0 !text-sm" (click)="showCreate = true"></button>
                  </div>
                </td>
              </tr>
            </ng-container>
            <tr *ngIf="loading">
              <td colspan="8" class="py-16 text-center text-text-3">
                <i class="pi pi-spin pi-spinner text-2xl block mb-2"></i>
                <div class="text-sm">Loading projects…</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ProjectListComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirm = inject(ConfirmationService);
  private toast = inject(MessageService);

  projects: Project[] = [];
  loading = true;
  showCreate = false;
  search = '';
  activeTab: StatusFilter = 'All';

  readonly statusTabs: StatusFilter[] = ['All', 'New', 'Active', 'Paused', 'Complete'];

  get filtered(): Project[] {
    let list = this.projects;
    const statuses = STATUS_FILTER_MAP[this.activeTab];
    if (statuses.length) list = list.filter(p => statuses.includes(p.status));
    if (this.search.trim()) {
      const q = this.search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      if (params.get('new') === 'true') this.showCreate = true;
    });
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getProjects(undefined, undefined, 100).subscribe({
      next: (p) => { this.projects = p; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openProject(id: string) {
    this.router.navigate(['/projects', id]);
  }

  editProject(p: Project) {
    // TODO Phase 25 — edit modal
  }

  togglePause(p: Project) {
    const isPaused = p.status === 'PAUSED';
    const action$ = isPaused ? this.api.resumeProject(p.id) : this.api.pauseProject(p.id);
    action$.subscribe({
      next: () => {
        p.status = isPaused ? 'PROCESSING' : 'PAUSED';
        this.toast.add({ severity: 'success', summary: isPaused ? 'Project resumed' : 'Project paused', life: 3000 });
      },
      error: () => this.toast.add({ severity: 'error', summary: 'Action failed', life: 3000 }),
    });
  }

  cancelJobs(p: Project) {
    this.confirm.confirm({
      message: `Cancel all pending jobs for "${p.name}"?`,
      accept: () => {
        this.api.cancelProjectJobs(p.id).subscribe({
          next: () => this.toast.add({ severity: 'success', summary: 'Jobs cancelled', life: 3000 }),
          error: () => this.toast.add({ severity: 'error', summary: 'Failed to cancel jobs', life: 3000 }),
        });
      },
    });
  }

  deleteProject(p: Project) {
    this.confirm.confirm({
      message: `Delete "${p.name}"? This cannot be undone.`,
      accept: () => {
        this.api.deleteProject(p.id).subscribe({
          next: () => {
            this.projects = this.projects.filter(x => x.id !== p.id);
            this.toast.add({ severity: 'success', summary: 'Project deleted', life: 3000 });
          },
          error: () => this.toast.add({ severity: 'error', summary: 'Failed to delete project', life: 3000 }),
        });
      },
    });
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'New', PROCESSING: 'Active', REVIEW: 'Active', PAUSED: 'Paused', COMPLETED: 'Complete',
    };
    return map[status] ?? status;
  }

  statusChipClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'bg-success/20 text-success';
      case 'REVIEW':
      case 'PROCESSING': return 'bg-primary/20 text-primary';
      case 'PAUSED': return 'bg-warning/20 text-warning';
      case 'DRAFT': return 'bg-surface-2 text-text-2';
      default: return 'bg-surface-2 text-text-3';
    }
  }
}
