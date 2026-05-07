import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { ApiService } from '../../core/services/api.service';
import { StatusDotComponent } from '../../shared/ui/status-dot/status-dot.component';
import { PriorityPillComponent } from '../../shared/ui/priority-pill/priority-pill.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, ProgressBarModule, AvatarModule, StatusDotComponent, PriorityPillComponent],
  template: `
    <div class="page fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Good morning, Ravi</h1>
          <p class="page-subtitle">5 pages need your review · 3 escalations open · last sync 2 min ago</p>
        </div>
        <div class="row">
          <button pButton icon="pi pi-download" label="Export weekly" [text]="true" class="!bg-surface-2 border border-border"></button>
          <button pButton icon="pi pi-plus" label="New project" severity="primary" routerLink="/projects"></button>
        </div>
      </div>

      <div class="grid--4 mb-8">
        <div class="card">
          <div class="card-eyebrow">Active projects</div>
          <div class="text-3xl font-mono font-bold mt-1 mb-2">{{ stats.totalProjects }}</div>
          <div class="text-xs text-success font-medium"><i class="pi pi-arrow-up text-[10px] mr-1"></i> +2 this month</div>
        </div>
        <div class="card">
          <div class="card-eyebrow">Pages translated</div>
          <div class="text-3xl font-mono font-bold mt-1 mb-2">{{ stats.totalPages | number }}</div>
          <div class="text-xs text-success font-medium"><i class="pi pi-arrow-up text-[10px] mr-1"></i> 132 this week</div>
        </div>
        <div class="card">
          <div class="card-eyebrow">Pending review</div>
          <div class="text-3xl font-mono font-bold text-warning mt-1 mb-2">{{ stats.pagesPending | number }}</div>
          <div class="text-xs text-text-2 font-medium"><i class="pi pi-arrow-down text-[10px] mr-1"></i> -18 since Mon</div>
        </div>
        <div class="card">
          <div class="card-eyebrow">Avg quality</div>
          <div class="text-3xl font-mono font-bold text-success mt-1 mb-2">82%</div>
          <div class="text-xs text-success font-medium"><i class="pi pi-arrow-up text-[10px] mr-1"></i> +4pts</div>
        </div>
      </div>

      <div class="grid--2">
        <!-- Throughput -->
        <div class="card col h-80 flex flex-col">
          <div class="card-header">
            <h3 class="card-title">Throughput · last 12 weeks</h3>
            <div class="row gap-2">
              <span class="page-pill !py-1 !px-3 is-active !w-auto text-xs font-semibold">Pages</span>
              <span class="page-pill !py-1 !px-3 !w-auto text-xs font-semibold text-text-2">Words</span>
            </div>
          </div>
          <!-- Bar chart placeholder matching the React mock -->
          <div class="flex-1 flex items-end justify-between px-2 gap-2 mt-4 relative">
             <div *ngFor="let v of weeklyPages; let i = index" 
                  class="bg-primary/40 hover:bg-primary transition-colors w-full rounded-t-md relative flex justify-center group"
                  [style.height.%]="(v / 132) * 100"
                  [title]="'Week ' + (i + 1) + ': ' + v + ' pages'">
                <span *ngIf="i === 0" class="absolute -bottom-6 text-xs text-text-3 font-mono">w1</span>
                <span *ngIf="i === weeklyPages.length - 1" class="absolute -bottom-6 text-xs text-text-3 font-mono">w{{weeklyPages.length}}</span>
             </div>
          </div>
          <div class="row row--between mt-8 text-xs text-text-3">
             <span>Total: 1,061 pages</span>
             <span class="mono">peak 132 · avg 88</span>
          </div>
        </div>

        <!-- My Queue -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">My queue</h3>
            <button pButton icon="pi pi-arrow-right" iconPos="right" label="View all" [text]="true" routerLink="/queue" class="!py-1"></button>
          </div>
          <div class="col gap-1 mt-2">
            <button *ngFor="let q of reviewQueue" 
                    [routerLink]="['/review', q.id]" 
                    class="page-pill justify-between px-3 py-2.5">
              <div class="row">
                <app-status-dot [status]="q.status"></app-status-dot>
                <span class="text-text-1 font-medium">{{ q.pageNumber || 'P45' }}</span>
                <span class="dim">·</span>
                <span class="muted ellipsis max-w-[140px] text-sm">{{ q.project?.name || "Pilgrim's Progress" }}</span>
              </div>
              <div class="row gap-3">
                <span class="text-xs text-error font-medium">{{ q.errorCount || 3 }} err</span>
                <app-priority-pill [level]="q.priority"></app-priority-pill>
              </div>
            </button>
            <div *ngIf="reviewQueue.length === 0" class="py-8 text-center text-text-3 text-sm">
              No pages in queue.
            </div>
          </div>
        </div>

        <!-- Recent Projects -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent projects</h3>
            <button pButton icon="pi pi-arrow-right" iconPos="right" label="View all" [text]="true" routerLink="/projects" class="!py-1"></button>
          </div>
          <div class="col gap-5 mt-2">
            <div *ngFor="let p of recentProjects" [routerLink]="['/projects', p.id]" class="cursor-pointer group">
              <div class="row row--between mb-2">
                <span class="font-medium text-text-1 group-hover:text-primary transition-colors">{{ p.name }}</span>
                <span class="mono dim text-xs">{{ calculateProgress(p) }}%</span>
              </div>
              <p-progressBar [value]="calculateProgress(p)" [showValue]="false"></p-progressBar>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Recent activity</h3>
            <button pButton icon="pi pi-arrow-right" iconPos="right" label="View all" [text]="true" class="!py-1"></button>
          </div>
          <div class="col gap-4 mt-2">
            <div *ngFor="let a of activity" class="row items-start gap-3">
               <p-avatar [label]="a.initials" shape="circle" class="mt-0.5 shrink-0"></p-avatar>
               <div class="flex-1 min-w-0">
                 <div class="text-sm">
                   <strong class="text-text-1">{{ a.user }}</strong>
                   <span class="muted mx-1">{{ a.action }}</span>
                   <span class="text-text-2">{{ a.target }}</span>
                 </div>
                 <div class="text-xs dim mt-1">{{ a.time }} ago</div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  
  stats = { totalProjects: 12, totalPages: 1240, pagesPending: 350 };
  recentProjects: any[] = [];
  reviewQueue: any[] = [];
  weeklyPages = [45, 52, 60, 48, 80, 102, 95, 110, 132, 105, 90, 112];
  activity = [
    { initials: 'RK', user: 'Ravi Kumar', action: 'approved', target: 'P12 · Don Quixote', time: '2m' },
    { initials: 'DA', user: 'Daniel Anbu', action: 'requested changes on', target: 'P46 · Pilgrim\'s Progress', time: '5m' },
    { initials: 'MR', user: 'Mary Rose', action: 'escalated', target: 'P78 · Mere Christianity', time: '12m' },
    { initials: 'AI', user: 'System', action: 'translated', target: 'Chapter 2 · Alchemist', time: '1h' },
  ];

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.api.getRecentProjects(4).subscribe({
      next: (projects) => { this.recentProjects = projects; },
      error: () => {},
    });

    this.api.getMyQueue(5).subscribe({
      next: (pages) => { this.reviewQueue = pages; },
      error: () => {},
    });
  }

  calculateProgress(project: any): number {
    const seed = project.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return (seed % 60) + 30;
  }
}