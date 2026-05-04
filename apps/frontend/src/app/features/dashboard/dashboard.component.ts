import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, TagModule, ButtonModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-surface-card p-4 rounded-lg border border-surface-700">
          <div class="text-gray-400 text-sm">Total Projects</div>
          <div class="text-3xl font-bold text-accent">{{ stats.totalProjects }}</div>
        </div>
        <div class="bg-surface-card p-4 rounded-lg border border-surface-700">
          <div class="text-gray-400 text-sm">Active Projects</div>
          <div class="text-3xl font-bold text-blue-400">{{ stats.activeProjects }}</div>
        </div>
        <div class="bg-surface-card p-4 rounded-lg border border-surface-700">
          <div class="text-gray-400 text-sm">Pages Translated</div>
          <div class="text-3xl font-bold text-green-400">{{ stats.pagesTranslated }}</div>
        </div>
        <div class="bg-surface-card p-4 rounded-lg border border-surface-700">
          <div class="text-gray-400 text-sm">In Review</div>
          <div class="text-3xl font-bold text-yellow-400">{{ stats.pagesInReview }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <p-card header="Recent Projects">
          <div class="flex flex-col gap-3">
            <div *ngFor="let project of recentProjects" class="flex justify-between items-center p-3 bg-surface-800 rounded">
              <div>
                <a [routerLink]="['/projects', project.id]" class="text-accent hover:underline font-medium">
                  {{ project.name }}
                </a>
                <div class="text-gray-500 text-sm">{{ project._count?.pages || 0 }} pages</div>
              </div>
              <p-tag [value]="project.status" [severity]="getStatusSeverity(project.status)"></p-tag>
            </div>
            <div *ngIf="recentProjects.length === 0" class="text-gray-500 text-center py-4">
              No projects yet. <a routerLink="/projects" class="text-accent hover:underline">Create one</a>
            </div>
          </div>
        </p-card>

        <p-card header="Review Queue">
          <div class="flex flex-col gap-3">
            <div *ngFor="let page of reviewQueue" class="flex justify-between items-center p-3 bg-surface-800 rounded">
              <div>
                <div class="font-medium">Page {{ page.pageNumber }}</div>
                <div class="text-gray-500 text-sm">Project: {{ page.project?.name }}</div>
              </div>
              <div class="flex gap-2">
                <span *ngIf="page.qualityScore" class="text-sm" [class]="getScoreColor(page.qualityScore)">
                  {{ page.qualityScore | number:'1.0-0' }}%
                </span>
                <button pButton label="Review" icon="pi pi-eye" class="p-button-sm p-button-text" [routerLink]="['/projects', page.projectId]"></button>
              </div>
            </div>
            <div *ngIf="reviewQueue.length === 0" class="text-gray-500 text-center py-4">
              No pages in review queue
            </div>
          </div>
        </p-card>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);

  stats = { totalProjects: 0, activeProjects: 0, pagesTranslated: 0, pagesInReview: 0 };
  recentProjects: any[] = [];
  reviewQueue: any[] = [];

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.api.getProjects().subscribe({
      next: (res) => {
        this.recentProjects = res.data.slice(0, 5);
        this.stats.totalProjects = res.pagination.total;
        this.stats.activeProjects = res.data.filter((p: any) => p.status === 'PROCESSING').length;
      }
    });

    this.api.getReviewQueue().subscribe({
      next: (pages) => {
        this.reviewQueue = pages.slice(0, 5);
        this.stats.pagesInReview = pages.length;
      }
    });
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

  getScoreColor(score: number): string {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    return 'text-red-400';
  }
}