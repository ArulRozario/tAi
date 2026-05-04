import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, TagModule],
  template: `
    <div class="p-8 space-y-8">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-text-primary">Dashboard</h1>
        <div class="flex gap-3">
          <button pButton label="Refresh" icon="pi pi-refresh" class="p-button-sm"></button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Statistics Card -->
        <div class="bg-secondary p-6 rounded-xl border border-border flex flex-col gap-4">
          <div class="flex items-center gap-2 text-text-secondary uppercase text-xs font-bold tracking-wider">
            <i class="pi pi-chart-bar text-accent"></i> 📊 STATISTICS
          </div>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-text-secondary">Total Projects:</span>
              <span class="text-xl font-bold text-text-primary">{{ stats.totalProjects }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-text-secondary">Total Pages:</span>
              <span class="text-xl font-bold text-text-primary">{{ stats.totalPages }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-text-secondary">Completed:</span>
              <span class="text-xl font-bold text-success">{{ stats.pagesCompleted }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-text-secondary">Pending:</span>
              <span class="text-xl font-bold text-warning">{{ stats.pagesPending }}</span>
            </div>
          </div>
        </div>

        <!-- Activity Card (Mocked Chart) -->
        <div class="bg-secondary p-6 rounded-xl border border-border flex flex-col gap-4">
          <div class="flex items-center gap-2 text-text-secondary uppercase text-xs font-bold tracking-wider">
            <i class="pi pi-chart-line text-accent"></i> 📈 ACTIVITY
          </div>
          <div class="h-32 flex items-end gap-2 justify-around">
            <div class="bg-accent w-8 rounded-t" style="height: 40%"></div>
            <div class="bg-accent w-8 rounded-t" style="height: 70%"></div>
            <div class="bg-accent w-8 rounded-t" style="height: 50%"></div>
            <div class="bg-accent w-8 rounded-t" style="height: 90%"></div>
            <div class="bg-accent w-8 rounded-t" style="height: 60%"></div>
            <div class="bg-accent w-8 rounded-t" style="height: 80%"></div>
            <div class="bg-accent w-8 rounded-t" style="height: 30%"></div>
          </div>
          <div class="text-center text-xs text-text-secondary">Pages translated per day (Last 7 days)</div>
        </div>

        <!-- Team Status Card -->
        <div class="bg-secondary p-6 rounded-xl border border-border flex flex-col gap-4">
          <div class="flex items-center gap-2 text-text-secondary uppercase text-xs font-bold tracking-wider">
            <i class="pi pi-users text-accent"></i> 👥 TEAM STATUS
          </div>
          <div class="space-y-3">
            <div *ngFor="let member of teamStatus" class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold">
                  {{ member.name[0] }}
                </div>
                <span class="text-sm">{{ member.name }}</span>
              </div>
              <span class="text-xs font-mono text-text-secondary">{{ member.pages }} pages</span>
            </div>
            <button pButton label="Manage Team →" class="p-button-text p-button-sm text-accent w-full text-left"></button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- My Queue Card -->
        <div class="bg-secondary p-6 rounded-xl border border-border flex flex-col gap-4">
          <div class="flex items-center gap-2 text-text-secondary uppercase text-xs font-bold tracking-wider">
            <i class="pi pi-list text-accent"></i> 📋 MY QUEUE
          </div>
          <div class="space-y-2">
            <div *ngFor="let page of reviewQueue" class="flex justify-between items-center p-3 bg-primary rounded-lg border border-border hover:border-accent transition-colors cursor-pointer group">
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-xs font-bold text-accent">
                  {{ page.pageNumber }}
                </span>
                <span class="text-sm text-text-primary group-hover:text-accent">{{ page.project?.name }} - Ch {{ page.chapter || '?' }}</span>
              </div>
              <p-tag [value]="page.priority" [severity]="getPrioritySeverity(page.priority)" class="text-[10px]"></p-tag>
            </div>
            <div *ngIf="reviewQueue.length === 0" class="text-center py-8 text-text-secondary">
              Queue is empty
            </div>
            <button pButton label="View All →" class="p-button-text p-button-sm text-accent w-full text-left mt-2"></button>
          </div>
        </div>

        <!-- Recent Projects Card -->
        <div class="bg-secondary p-6 rounded-xl border border-border flex flex-col gap-4">
          <div class="flex items-center gap-2 text-text-secondary uppercase text-xs font-bold tracking-wider">
            <i class="pi pi-folder-open text-accent"></i> 📁 RECENT PROJECTS
          </div>
          <div class="space-y-2">
            <div *ngFor="let project of recentProjects" class="flex justify-between items-center p-3 bg-primary rounded-lg border border-border hover:border-accent transition-colors cursor-pointer group">
              <div>
                <div class="text-sm font-medium text-text-primary group-hover:text-accent">{{ project.name }}</div>
                <div class="text-xs text-text-secondary">{{ project.sourceLang }} → {{ project.targetLang }}</div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-24 h-2 bg-surface rounded-full overflow-hidden">
                  <div class="bg-accent h-full" [style.width.%]="calculateProgress(project)"></div>
                </div>
                <span class="text-xs font-mono">{{ calculateProgress(project) }}%</span>
              </div>
            </div>
            <div *ngIf="recentProjects.length === 0" class="text-center py-8 text-text-secondary">
              No projects found
            </div>
            <button pButton label="View All →" class="p-button-text p-button-sm text-accent w-full text-left mt-2"></button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  
  stats = { totalProjects: 0, totalPages: 0, pagesCompleted: 0, pagesPending: 0 };
  recentProjects: any[] = [];
  reviewQueue: any[] = [];
  teamStatus = [
    { name: 'Admin', pages: 124 },
    { name: 'John', pages: 85 },
    { name: 'Alice', pages: 62 },
    { name: 'Bob', pages: 41 },
  ];

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.api.getProjects().subscribe({
      next: (res) => {
        this.recentProjects = res.data.slice(0, 5);
        this.stats.totalProjects = res.pagination.total;
        
        // Mock additional stats based on projects
        this.stats.totalPages = res.pagination.total * 150; 
        this.stats.pagesCompleted = Math.floor(this.stats.totalPages * 0.6);
        this.stats.pagesPending = this.stats.totalPages - this.stats.pagesCompleted;
      }
    });

    this.api.getReviewQueue().subscribe({
      next: (pages) => {
        this.reviewQueue = pages.slice(0, 5);
      }
    });
  }

  calculateProgress(project: any): number {
    if (!project._count || !project._count.pages) return 0;
    // Mock progress for visual effect
    return Math.floor(Math.random() * 100);
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | undefined {
    const map: Record<string, 'danger' | 'warn' | 'info' | 'secondary'> = {
      'URGENT': 'danger',
      'HIGH': 'warn',
      'NORMAL': 'info',
      'LOW': 'secondary',
    };
    return map[priority] || 'secondary';
  }
}