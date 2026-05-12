import { Component, ViewChild, inject, signal, OnInit } from '@angular/core';
import { faro } from '@grafana/faro-web-sdk';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
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
export class ProjectsComponent implements OnInit {
  private router = inject(Router);
  private projectService = inject(ProjectService);

  @ViewChild('createModal') createModal!: CreateProjectModal;

  /* Dynamic project dataset */
  projects = signal<Project[]>([]);
  totalProjects = signal(0);
  loading = signal(false);

  /* Select dropdown items */
  filterOptions = [
    { label: 'All', value: 'all' }
  ];
  selectedFilter = 'all';

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading.set(true);
    this.projectService.getProjects().subscribe({
      next: (res) => {
        this.projects.set(res.data);
        this.totalProjects.set(res.pagination.total);
        this.loading.set(false);
      },
      error: (err) => {
        faro.api?.pushError(new Error('Failed to load projects list'), { context: { error: String(err) } });
        this.loading.set(false);
      }
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
