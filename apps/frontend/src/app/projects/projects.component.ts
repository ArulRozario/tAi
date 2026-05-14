import { Component, ViewChild, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { faro } from '@grafana/faro-web-sdk';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

/* Import standard PrimeNG Modules */
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { CreateProjectModal } from './create-project-modal/create-project-modal';
import { ProjectService, Project } from './projects.service';
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
    AvatarModule,
    SelectModule,
    CreateProjectModal
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);

  @ViewChild('createModal') createModal!: CreateProjectModal;

  projects = signal<Project[]>([]);
  totalProjects = signal(0);
  loading = signal(false);
  translationStatus = signal<Record<string, { isRunning: boolean; isPaused: boolean; done: number; total: number; percent: number }>>({});

  filterOptions = [{ label: 'All', value: 'all' }];
  selectedFilter = 'all';

  readonly isReviewer = computed(() => {
    const u = this.authService.getCurrentUser();
    return u?.role === 'REVIEWER';
  });

  readonly canCreateProject = computed(() => {
    const u = this.authService.getCurrentUser();
    return u?.role === 'ADMIN' || u?.role === 'MASTER';
  });

  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.loadProjects();
    this.pollTranslationStatus();
  }

  ngOnDestroy() {
    if (this.pollTimer) clearTimeout(this.pollTimer);
  }

  loadProjects() {
    this.loading.set(true);
    const assignedToMe = this.isReviewer();
    this.projectService.getProjects(1, 20, assignedToMe).subscribe({
      next: (res) => {
        this.projects.set(res.data);
        this.totalProjects.set(res.pagination.total);
        this.loading.set(false);
      },
      error: (err) => {
        faro.api?.pushError(new Error('Failed to load projects list'), { context: { error: String(err) } });
        this.loading.set(false);
      },
    });
  }

  private pollTranslationStatus() {
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

  navigateToProject(id: string): void {
    this.router.navigate(['/projects', id]);
  }

  getInitials(name?: string): string {
    if (!name) return 'RK';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getLanguageString(project: Project): string {
    const src = project.sourceLang === 'en' ? 'English' : project.sourceLang;
    const tgt = project.targetLang === 'ta' ? 'Tamil' : project.targetLang;
    const styleGuide = project.styleGuide?.name || 'Thiruviviliam';
    return `${src} → ${tgt} • ${styleGuide}`;
  }

  getProjectStatus(status: string): string {
    return status.toLowerCase();
  }
}
