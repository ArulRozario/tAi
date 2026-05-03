import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ApiService, Project } from '../../core/services/api.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    InputTextModule,
    FormsModule,
  ],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Projects</h1>
        <button pButton label="New Project" icon="pi pi-plus" (click)="showDialog = true"></button>
      </div>

      <p-table 
        [value]="projects" 
        [paginator]="true" 
        [rows]="10"
        [loading]="loading"
        [tableStyle]="{ 'min-width': '50rem' }"
        styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Pages</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-project>
          <tr>
            <td>
              <a [routerLink]="['/projects', project.id]" class="text-accent hover:underline">
                {{ project.name }}
              </a>
              <p class="text-sm text-gray-400">{{ project.description }}</p>
            </td>
            <td>
              <p-tag [value]="project.status" [severity]="getStatusSeverity(project.status)"></p-tag>
            </td>
            <td>{{ project.totalPages }}</td>
            <td>{{ project.createdAt | date:'short' }}</td>
            <td>
              <button pButton icon="pi pi-eye" class="p-button-text" [routerLink]="['/projects', project.id]"></button>
              <button pButton icon="pi pi-trash" class="p-button-text p-button-danger" (click)="deleteProject(project)"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="5" class="text-center py-8 text-gray-400">
              No projects yet. Create your first project to get started.
            </td>
          </tr>
        </ng-template>
      </p-table>

      <p-dialog header="New Project" [(visible)]="showDialog" [modal]="true" [style]="{width: '500px'}">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label for="name">Project Name</label>
            <input pInputText id="name" [(ngModel)]="newProject.name" placeholder="Enter project name" />
          </div>
          <div class="flex flex-col gap-2">
            <label for="description">Description</label>
            <input pInputText id="description" [(ngModel)]="newProject.description" placeholder="Optional description" />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showDialog = false"></button>
          <button pButton label="Create" (click)="createProject()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `
})
export class ProjectListComponent implements OnInit {
  private api = inject(ApiService);
  
  projects: Project[] = [];
  loading = false;
  showDialog = false;
  newProject = { name: '', description: '' };

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

  createProject() {
    if (!this.newProject.name) return;
    
    this.api.createProject(this.newProject).subscribe({
      next: (project) => {
        this.projects.unshift(project);
        this.showDialog = false;
        this.newProject = { name: '', description: '' };
      }
    });
  }

  deleteProject(project: Project) {
    if (confirm(`Delete project "${project.name}"?`)) {
      this.api.deleteProject(project.id).subscribe({
        next: () => {
          this.projects = this.projects.filter(p => p.id !== project.id);
        }
      });
    }
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'DRAFT': 'secondary',
      'PROCESSING': 'warn',
      'REVIEW': 'info',
      'COMPLETED': 'success',
      'ARCHIVED': 'secondary',
    };
    return map[status] || 'secondary';
  }
}