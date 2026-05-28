import {
  Component,
  ViewChild,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { faro } from '@grafana/faro-web-sdk';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { CreateProjectModal } from './create-project-modal/create-project-modal';
import { CollectionPanel } from './collection-panel/collection-panel';
import { ProjectService, Project } from './projects.service';
import { CollectionsService, CollectionNode } from './collections.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ProgressBarModule,
    TagModule,
    SelectModule,
    DialogModule,
    ToastModule,
    CreateProjectModal,
    CollectionPanel,
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private collectionsService = inject(CollectionsService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  @ViewChild('createModal') createModal!: CreateProjectModal;

  projects = signal<Project[]>([]);
  totalProjects = signal(0);
  loading = signal(false);
  searchQuery = signal('');
  translationStatus = signal<
    Record<string, { isRunning: boolean; isPaused: boolean; done: number; total: number; percent: number }>
  >({});

  // ── Collection filter ────────────────────────────────────────────────────
  selectedCollectionId = signal<string | null>(null);
  collectionTree = signal<CollectionNode[]>([]);

  readonly selectedCollectionName = computed(() => {
    const id = this.selectedCollectionId();
    if (!id) return '';
    const flat = this.collectionsService.flattenTree(this.collectionTree());
    return flat.find((n) => n.id === id)?.name ?? '';
  });

  readonly collectionFlatOptions = computed(() => {
    const flat = this.collectionsService.flattenTree(this.collectionTree());
    return [
      { label: '— None (ungrouped) —', value: null },
      ...flat.map((n) => ({
        label: ' '.repeat(n.depth * 4) + (n.icon ?? '📁') + ' ' + n.name,
        value: n.id,
      })),
    ];
  });

  // ── Computed totals ──────────────────────────────────────────────────────
  readonly totalPages = computed(() =>
    this.filteredProjects().reduce((sum, p) => sum + (p._count?.pages ?? 0), 0)
  );

  // ── Delete dialog ────────────────────────────────────────────────────────
  deleteDialogVisible = signal(false);
  pendingDeleteProject = signal<Project | null>(null);

  // ── Assign dialog ────────────────────────────────────────────────────────
  assignDialogVisible = signal(false);
  assigningProject = signal<Project | null>(null);
  assignCollectionId: string | null = null;
  assignSaving = signal(false);

  // ── Filtered projects ────────────────────────────────────────────────────
  readonly filteredProjects = computed(() => {
    let list = this.projects();

    // Collection filter
    const colId = this.selectedCollectionId();
    if (colId !== null) {
      const ids = this.getSubtreeProjectIds(colId);
      list = list.filter((p) => ids.has(p.collectionId ?? ''));
    }

    // Status filter
    if (this.selectedFilter !== 'all') {
      list = list.filter((p) => p.status === this.selectedFilter);
    }

    // Text search
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));

    return list;
  });

  filterOptions = [
    { label: 'All',        value: 'all' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Translated', value: 'REVIEW' },
    { label: 'Paused',     value: 'PAUSED' },
    { label: 'Complete',   value: 'COMPLETED' },
    { label: 'Draft',      value: 'DRAFT' },
    { label: 'Archived',   value: 'ARCHIVED' },
  ];
  selectedFilter = 'all';

  readonly isReviewer = computed(() => this.authService.getCurrentUser()?.role === 'REVIEWER');
  readonly canCreateProject = computed(() => {
    const r = this.authService.getCurrentUser()?.role;
    return r === 'ADMIN' || r === 'MASTER';
  });

  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.loadProjects();
    this.pollTranslationStatus();
    this.loadCollectionTree();
  }

  ngOnDestroy() {
    if (this.pollTimer) clearTimeout(this.pollTimer);
  }

  // ── Data loading ─────────────────────────────────────────────────────────

  loadProjects() {
    this.loading.set(true);
    const assignedToMe = this.isReviewer();
    this.projectService.getProjects(1, 200, assignedToMe).subscribe({
      next: (res) => {
        this.projects.set(res.data);
        this.totalProjects.set(res.pagination.total);
        this.loading.set(false);
      },
      error: (err) => {
        faro.api?.pushError(new Error('Failed to load projects list'), {
          context: { error: String(err) },
        });
        this.loading.set(false);
      },
    });
  }

  loadCollectionTree() {
    this.collectionsService.getTree().subscribe({
      next: (tree) => this.collectionTree.set(tree),
    });
  }

  private pollTranslationStatus() {
    // Cancel any pending tick before starting a new one (safe to call multiple times)
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.projectService.getActiveTranslations().subscribe({
      next: (status) => {
        this.translationStatus.set(status);
        const delay = Object.keys(status).length > 0 ? 3000 : 10000;
        this.pollTimer = setTimeout(() => this.pollTranslationStatus(), delay);
      },
      error: () => {
        this.pollTimer = setTimeout(() => this.pollTranslationStatus(), 10000);
      },
    });
  }

  // ── Collection selection ─────────────────────────────────────────────────

  onCollectionSelect(id: string | null) {
    this.selectedCollectionId.set(id);
  }

  onTreeChange() {
    this.loadCollectionTree();
    this.loadProjects();
  }

  /**
   * Returns the set of collection IDs that are within the subtree rooted at
   * `rootId`, including the root itself.  Used for collection-filtered view.
   */
  private getSubtreeProjectIds(rootId: string): Set<string> {
    const ids = new Set<string>();
    const visit = (nodes: CollectionNode[]) => {
      for (const n of nodes) {
        ids.add(n.id);
        if (n.children.length > 0) visit(n.children);
      }
    };
    const flat = this.collectionsService.flattenTree(this.collectionTree());
    const root = flat.find((n) => n.id === rootId);
    if (root) {
      // Find the node in the original tree and walk its subtree
      const findAndVisit = (nodes: CollectionNode[], target: string): boolean => {
        for (const n of nodes) {
          if (n.id === target) { visit([n]); return true; }
          if (findAndVisit(n.children, target)) return true;
        }
        return false;
      };
      findAndVisit(this.collectionTree(), rootId);
    }
    return ids;
  }

  // ── Collection path helpers ──────────────────────────────────────────────

  /** Flat map of all collections, keyed by id. Recomputed whenever the tree changes. */
  private readonly collectionMapComputed = computed(() => {
    const flat = this.collectionsService.flattenTree(this.collectionTree());
    const map = new Map<string, CollectionNode>();
    for (const node of flat) map.set(node.id, node);
    return map;
  });

  /**
   * Returns the ordered ancestor chain [root, …, node] for the given collection id.
   * Used to render the full path tag on each project row.
   */
  collectionPathFor(collectionId: string): CollectionNode[] {
    const map = this.collectionMapComputed();
    const path: CollectionNode[] = [];
    let current = map.get(collectionId);
    while (current) {
      path.unshift(current);
      current = current.parentId ? map.get(current.parentId) : undefined;
    }
    return path;
  }

  // ── Assign dialog ────────────────────────────────────────────────────────

  openAssignDialog(event: Event, project: Project) {
    event.stopPropagation();
    this.assigningProject.set(project);
    this.assignCollectionId = project.collection?.id ?? null;
    this.assignDialogVisible.set(true);
  }

  saveAssign() {
    const project = this.assigningProject();
    if (!project) return;
    this.assignSaving.set(true);
    this.collectionsService.assignProject(project.id, this.assignCollectionId).subscribe({
      next: () => {
        this.assignSaving.set(false);
        this.assignDialogVisible.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Moved',
          detail: `"${project.name}" was moved successfully.`,
          life: 3000,
        });
        this.loadProjects();
      },
      error: () => this.assignSaving.set(false),
    });
  }

  // ── Row actions ──────────────────────────────────────────────────────────

  navigateToProject(id: string): void {
    this.router.navigate(['/projects', id]);
  }

  getInitials(name?: string): string {
    if (!name) return 'RK';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getLanguageString(project: Project): string {
    const src = project.sourceLang === 'en' ? 'English' : project.sourceLang;
    const tgt = project.targetLang === 'ta' ? 'Tamil' : project.targetLang;
    const styleGuide = project.styleGuide?.name || 'Thiruviviliam';
    return `${src} → ${tgt} • ${styleGuide}`;
  }

  /**
   * True when the project has active (running/queued) translation jobs.
   * Uses translationStatus (polled from getActiveTranslations) rather than
   * project.status, so it's accurate even after cancel resets project.status.
   */
  isTranslationRunning(project: Project): boolean {
    return this.translationStatus()[project.id]?.isRunning ?? false;
  }

  /**
   * True when all translation jobs for the project are paused (none running/queued).
   */
  isTranslationPaused(project: Project): boolean {
    return this.translationStatus()[project.id]?.isPaused ?? false;
  }

  pauseProject(event: Event, project: Project): void {
    event.stopPropagation();
    this.projectService.pauseProject(project.id).subscribe({
      next: () => {
        this.loadProjects();
        this.pollTranslationStatus();
      },
    });
  }

  resumeProject(event: Event, project: Project): void {
    event.stopPropagation();
    this.projectService.resumeProject(project.id).subscribe({
      next: () => {
        this.loadProjects();
        this.pollTranslationStatus();
      },
    });
  }

  cancelJobs(event: Event, project: Project): void {
    event.stopPropagation();
    this.projectService.cancelProjectJobs(project.id).subscribe({
      next: () => {
        this.loadProjects();
        this.pollTranslationStatus();
      },
    });
  }

  deleteProject(event: Event, project: Project): void {
    event.stopPropagation();
    this.pendingDeleteProject.set(project);
    this.deleteDialogVisible.set(true);
  }

  confirmDeleteProject(): void {
    const project = this.pendingDeleteProject();
    if (!project) return;
    this.projectService.deleteProject(project.id).subscribe({
      next: () => {
        this.deleteDialogVisible.set(false);
        this.pendingDeleteProject.set(null);
        this.loadProjects();
      },
    });
  }

  // ── Row keyboard navigation ──────────────────────────────────────────────

  handleRowKeydown(event: KeyboardEvent, projectId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.navigateToProject(projectId);
    }
  }

  // ── Progress helpers ─────────────────────────────────────────────────────

  getProgressValue(project: Project): number {
    const ts = this.translationStatus()[project.id];
    if (ts) return ts.percent;
    if (project.stats?.approved && project._count?.pages) {
      return (project.stats.approved / project._count.pages) * 100;
    }
    return 0;
  }

  getProgressClass(project: Project): string {
    const ts = this.translationStatus()[project.id];
    if (!ts) return 'tpb-idle';
    return ts.isPaused ? 'tpb-paused' : 'tpb-active';
  }

  isProgressActive(project: Project): boolean {
    return !!this.translationStatus()[project.id];
  }

  // ── Avatar colour ────────────────────────────────────────────────────────

  /** Deterministic colour derived from the user's name for visual differentiation. */
  getAvatarColor(name?: string): string {
    const palette = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4', '#84cc16'];
    if (!name) return palette[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }

  // ── Utilities ────────────────────────────────────────────────────────────

  /** Convert a hex colour to rgba with the given alpha (for tinted collection badges). */
  hexToAlpha(hex: string | null | undefined, alpha: number): string {
    if (!hex) return `rgba(99,102,241,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
