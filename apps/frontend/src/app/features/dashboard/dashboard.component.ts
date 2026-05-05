import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, TagModule, ProgressBarModule],
  template: `
    <div class="space-y-6 animate-fade-in relative">
      <!-- HEADER (Slim) -->
      <header class="flex items-center justify-between px-2">
        <div class="flex flex-col">
          <h1 class="text-xl font-black text-white leading-none mb-1">Mission Control</h1>
          <div class="flex items-center gap-2">
            <span class="micro-label">Neural Grid Status: Operational</span>
            <div class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>
        <div class="flex items-center gap-4">
           <div class="flex items-center gap-2 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-white/5">
              <span class="micro-label">Efficiency</span>
              <span class="text-sm font-black text-emerald-500">98.4%</span>
           </div>
           <button pButton icon="pi pi-sync" class="!h-9 !w-9 !bg-white/5 !border-none !text-slate-600 hover:!text-primary"></button>
        </div>
      </header>

      <!-- STATS STRIP (Ultra-Compact) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div *ngFor="let stat of [
          {label: 'Active Clusters', value: stats.totalProjects, icon: 'pi-box', trend: '+2.4%', color: 'primary'},
          {label: 'Neural Units', value: stats.totalPages, icon: 'pi-file', trend: 'STABLE', color: 'slate'},
          {label: 'Verified Assets', value: stats.pagesCompleted, icon: 'pi-check-circle', trend: 'SYNCED', color: 'emerald'},
          {label: 'Latency (ms)', value: '14ms', icon: 'pi-bolt', trend: '-2ms', color: 'amber'}
        ]" class="glass-card hoverable p-4 border-white/5 flex items-center justify-between">
          <div class="flex items-center gap-3">
             <div [class]="'w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-lg bg-' + stat.color + '-500/20 text-' + stat.color + '-400 border border-' + stat.color + '-500/20'">
                <i [class]="'pi ' + stat.icon + ' text-sm'"></i>
             </div>
             <div>
                <div class="text-lg font-black text-white tracking-tighter">{{ stat.value | number }}</div>
                <div class="micro-label !text-[7px] !tracking-[0.2em] opacity-60">{{ stat.label }}</div>
             </div>
          </div>
          <span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/5 text-slate-500">{{ stat.trend }}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- MISSION QUEUE -->
        <div class="lg:col-span-2 space-y-4">
          <div class="flex justify-between items-center px-2">
            <span class="micro-label">High-Priority Directives</span>
            <a routerLink="/queue" class="micro-label !text-primary hover:!text-white transition-colors cursor-pointer">Explore Full Grid <i class="pi pi-arrow-right text-[7px] ml-1"></i></a>
          </div>
          
          <div class="space-y-2">
            <div *ngFor="let page of reviewQueue" 
                 class="glass-card hoverable !bg-slate-950/20 p-3 flex items-center justify-between group border-white/5">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-lg bg-slate-900 border border-white/5 flex flex-col items-center justify-center group-hover:border-primary/30 transition-all">
                  <span class="text-[6px] font-black text-slate-700 leading-none mb-0.5">UNIT</span>
                  <span class="text-base font-black text-white leading-tight">{{ page.pageNumber }}</span>
                </div>
                <div>
                  <div class="text-sm font-black text-slate-200 group-hover:text-primary transition-colors tracking-tight">{{ page.project?.name }}</div>
                  <div class="flex items-center gap-2 mt-0.5">
                     <span class="text-[8px] font-black text-slate-700 uppercase tracking-widest">ID: {{ page.id.substring(0,8) }}</span>
                     <span class="w-0.5 h-0.5 bg-slate-800 rounded-full"></span>
                     <span class="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{{ page.updatedAt | date:'shortTime' }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <span [class]="'px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ' + getPriorityClass(page.priority)">{{ page.priority }}</span>
                <button pButton icon="pi pi-bolt" class="p-button-text !p-0 !w-8 !h-8 !text-slate-700 group-hover:!text-primary transition-all" [routerLink]="['/review', page.id]"></button>
              </div>
            </div>
            
            <div *ngIf="reviewQueue.length === 0" class="glass-card !bg-slate-950/10 p-12 text-center border-dashed border-white/5">
              <i class="pi pi-shield text-4xl text-slate-900 mb-4"></i>
              <p class="micro-label !text-slate-700">Neural Buffer Synchronized</p>
            </div>
          </div>
        </div>

        <!-- SIDEBAR (Analytics) -->
        <div class="space-y-6">
          <div class="glass-card p-5 border-white/5 bg-slate-950/40 relative overflow-hidden group">
             <div class="flex items-center justify-between mb-6">
                <span class="micro-label">System Pulse</span>
                <span class="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Optimized</span>
             </div>
             <div class="flex items-end justify-between h-24 px-1 gap-2">
               <div *ngFor="let h of [40, 70, 50, 95, 60, 85, 45]" 
                    class="bg-slate-800 hover:bg-primary rounded-t-md transition-all duration-500 w-full relative group/bar"
                    [style.height.%]="h">
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[6px] font-black text-white opacity-0 group-hover/bar:opacity-100 transition-opacity">{{h}}%</div>
               </div>
             </div>
             <div class="mt-4 pt-4 border-t border-white/5 flex justify-between text-[7px] font-black text-slate-700 uppercase tracking-widest">
                <span>12:00</span>
                <span>ACTIVE PHASE</span>
                <span>24:00</span>
             </div>
          </div>

          <div class="space-y-3">
            <span class="micro-label px-2">Recent Deployments</span>
            <div *ngFor="let project of recentProjects" 
                 class="glass-card hoverable p-3 border-white/5 bg-slate-950/20 group cursor-pointer"
                 [routerLink]="['/projects', project.id]">
              <div class="flex justify-between items-start mb-3">
                 <div>
                    <div class="text-xs font-black text-slate-300 group-hover:text-primary transition-colors">{{ project.name }}</div>
                    <div class="text-[7px] font-black text-slate-700 mt-0.5 uppercase tracking-widest">{{ project.targetLang }} Protocol</div>
                 </div>
                 <span class="text-[8px] font-black text-primary">{{ calculateProgress(project) }}%</span>
              </div>
              <div class="w-full h-0.5 bg-slate-900 rounded-full overflow-hidden">
                 <div class="h-full bg-primary transition-all duration-1000" [style.width.%]="calculateProgress(project)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-progressbar {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        .p-progressbar-value {
          background: linear-gradient(90deg, #6366f1 0%, #10b981 100%);
          border-radius: 10px;
        }
      }
      
      .p-tag {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  
  stats = { totalProjects: 0, totalPages: 0, pagesCompleted: 0, pagesPending: 0 };
  recentProjects: any[] = [];
  reviewQueue: any[] = [];

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.api.getProjects().subscribe({
      next: (res) => {
        this.recentProjects = res.data.slice(0, 3);
        this.stats.totalProjects = res.pagination.total;
        this.stats.totalPages = res.pagination.total * 128 || 1280; // Estimate if 0
        this.stats.pagesCompleted = Math.floor(this.stats.totalPages * 0.72);
        this.stats.pagesPending = Math.floor(this.stats.totalPages * 0.08);
      }
    });

    this.api.getReviewQueue().subscribe({
      next: (pages) => {
        this.reviewQueue = pages.slice(0, 5);
      }
    });
  }

  calculateProgress(project: any): number {
    // Deterministic mock progress based on ID
    const seed = project.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return (seed % 60) + 30;
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      'URGENT': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      'HIGH': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      'NORMAL': 'bg-primary/10 text-primary border-primary/20',
      'LOW': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    };
    return map[priority] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  }
}