import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { ApiService, Project } from '../../core/services/api.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, TagModule, InputTextModule, DropdownModule, FormsModule],
  template: `
    <div class="p-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-text-primary">Projects</h1>
        <button pButton label="New Project" icon="pi pi-plus" class="p-button-sm"></button>
      </div>

      <div class="flex gap-4 mb-6">
        <div class="flex-1">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search"></i>
            <input pInputText placeholder="Search projects..." class="w-full p-inputtext-sm" [(ngModel)]="searchTerm" />
          </span>
        </div>
        <p-dropdown 
          [options]="statusOptions" 
          [(ngModel)]="selectedStatus" 
          placeholder="Filter Status" 
          styleClass="p-inputtext-sm">
        </p-dropdown>
      </div>

      <div class="bg-secondary rounded-xl border border-border overflow-hidden">
        <p-table 
          [value]="filteredProjects" 
          [loading]="loading"
          [paginator]="true"
          [rows]="10"
          styleClass="p-datatable-sm"
          [tableStyle]="{ 'min-width': '60rem' }">
          <ng-template pTemplate="header">
            <tr>
              <th class="bg-primary text-text-secondary uppercase text-xs font-bold p-4">Project</th>
              <th class="bg-primary text-text-secondary uppercase text-xs font-bold p-4">Chapters</th>
              <th class="bg-primary text-text-secondary uppercase text-xs font-bold p-4">Pages</th>
              <th class="bg-primary text-text-secondary uppercase text-xs font-bold p-4">Progress</th>
              <th class="bg-primary text-text-secondary uppercase text-xs font-bold p-4">Status</th>
              <th class="bg-primary text-text-secondary uppercase text-xs font-bold p-4">Owner</th>
              <th class="bg-primary text-text-secondary uppercase text-xs font-bold p-4 text-right">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-project>
            <tr class="hover:bg-primary transition-colors border-b border-border">
              <td class="p-4">
                <a [routerLink]="['/projects', project.id]" class="text-accent hover:underline font-medium">
                  {{ project.name }}
                </a>
              </td>
              <td class="p-4 text-text-secondary">{{ project._count?.chapters || 0 }}</td>
              <td class="p-4 text-text-secondary">{{ project._count?.pages || 0 }}</td>
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-24 h-2 bg-surface rounded-full overflow-hidden">
                    <div class="bg-accent h-full" [style.width.%]="calculateProgress(project)"></div>
                  </div>
                  <span class="text-xs font-mono text-text-secondary">{{ calculateProgress(project) }}%</span>
                </div>
              </td>
              <td class="p-4">
                <p-tag [value]="project.status" [severity]="getStatusSeverity(project.status)" class="text-[10px]"></p-tag>
              </td>
              <td class="p-4 text-text-secondary text-sm">{{ project.owner?.name || 'Admin' }}</td>
              <td class="p-4 text-right">
                <button pButton icon="pi pi-ellipsis-v" class="p-button-text p-button-sm p-button-secondary"></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="text-center py-12 text-text-secondary">
                No projects found. <a routerLink="/projects" class="text-accent hover:underline">Create your first project</a>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `
})
export class ProjectListComponent implements OnInit {
  private api = inject(ApiService);
  
  projects: Project[] = [];
  loading = false;
  searchTerm = '';
  selectedStatus: string | null = null;

  statusOptions = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Review', value: 'REVIEW' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading = true;
    this.api.getProjects().subscribe({
      next: (res) => {
        this.projects = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get filteredProjects() {
    return this.projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = !this.selectedStatus || p.status === this.selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }

  calculateProgress(project: Project): number {
    // Mock progress for visual impact
    return Math.floor(Math.random() * 100);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'info' | 'warn' | 'secondary'> = {
      'COMPLETED': 'success',
      'PROCESSING': 'info',
      'REVIEW': 'warn',
      'DRAFT': 'secondary',
    };
    return map[status] || 'secondary';
  }
}