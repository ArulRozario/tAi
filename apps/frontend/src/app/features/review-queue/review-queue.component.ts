import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ApiService, Page } from '../../core/services/api.service';

@Component({
  selector: 'app-review-queue',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, TagModule, InputTextModule, FormsModule],
  template: `
    <div class="space-y-4 animate-fade-in relative">
      <!-- HEADER BAR (Slim & Professional) -->
      <header class="flex items-center justify-between px-2">
        <div class="flex items-center gap-4">
          <div class="flex flex-col">
            <h1 class="text-xl font-black text-white leading-none mb-1">Quality Control Queue</h1>
            <div class="flex items-center gap-2">
              <span class="micro-label">Neural Integrity Stream</span>
              <div class="w-1 h-1 rounded-full bg-primary animate-pulse"></div>
            </div>
          </div>
        </div>
        <div class="flex gap-4 items-center">
           <div class="glass-card !bg-slate-950/40 px-4 py-2 flex items-center gap-3 border-white/5">
              <span class="text-[8px] font-black text-slate-600 uppercase tracking-widest">Pending Verification</span>
              <span class="text-xl font-black text-primary tracking-tighter">{{ pages.length }}</span>
           </div>
           <button pButton label="Initialize Session" icon="pi pi-play" 
                   class="!h-10 !px-5 !bg-primary !border-none shadow-lg shadow-primary/10"></button>
        </div>
      </header>

      <!-- CONTROL RAIL (Compact Search/Filter) -->
      <div class="glass-card !bg-slate-950/40 p-2 flex flex-wrap lg:flex-nowrap items-center gap-3 border-white/5">
        <div class="relative flex-1 group">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 text-[10px]"></i>
          <input type="text" placeholder="Scan quality logs..." 
                 class="glass-input w-full !h-9 !pl-9 !bg-transparent !border-none text-[10px]" 
                 [(ngModel)]="filterTerm" />
        </div>
        <div class="flex items-center gap-1 bg-slate-950/40 p-1 rounded-lg border border-white/5">
           <button *ngFor="let p of ['ALL', 'URGENT', 'HIGH', 'NORMAL']"
                   [class]="'px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ' + 
                             (p === 'ALL' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:text-slate-400')">
             {{ p }}
           </button>
        </div>
        <button pButton icon="pi pi-refresh" class="!h-9 !w-9 !bg-white/5 !border-none !text-slate-600 hover:!text-primary transition-all shadow-md" (click)="loadQueue()"></button>
      </div>

      <!-- GRID (High-Density) -->
      <div class="glass-card !bg-slate-950/20 border-white/5 overflow-hidden shadow-2xl">
        <p-table 
          [value]="filteredPages" 
          [loading]="loading"
          [paginator]="true"
          [rows]="12"
          responsiveLayout="scroll"
          styleClass="p-datatable-custom"
          [tableStyle]="{ 'min-width': '70rem' }">
          <ng-template pTemplate="header">
            <tr>
              <th class="w-[30%]">Source Origin</th>
              <th class="text-center">Unit</th>
              <th class="text-center">Risk Vector</th>
              <th>Neural Accuracy</th>
              <th class="text-center">Lifecycle</th>
              <th class="text-right">Action</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-page>
            <tr class="group cursor-pointer">
              <td>
                <div class="flex items-center gap-3">
                  <div class="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                  <div>
                     <div class="text-sm font-black text-slate-200 group-hover:text-primary transition-colors tracking-tight">{{ page.project?.name || 'Neural Stream' }}</div>
                     <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-[8px] font-black text-slate-700 uppercase tracking-widest">{{ page.id.substring(0,8) }}</span>
                        <span class="w-0.5 h-0.5 bg-slate-800 rounded-full"></span>
                        <span class="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{{ page.updatedAt | date:'mediumTime' }}</span>
                     </div>
                  </div>
                </div>
              </td>
              <td class="text-center">
                <div class="w-9 h-9 mx-auto rounded-lg bg-slate-900 border border-white/5 flex flex-col items-center justify-center shadow-inner group-hover:border-primary/20 transition-all">
                   <span class="text-[7px] font-black text-slate-700 leading-none mb-0.5">PG</span>
                   <span class="text-base font-black text-white leading-tight">{{ page.pageNumber }}</span>
                </div>
              </td>
              <td class="text-center">
                <span [class]="'inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ' + getPriorityColor(page.priority)">
                  {{ page.priority }}
                </span>
              </td>
              <td>
                <div class="flex items-center gap-4 min-w-[150px]">
                   <div class="flex-1 h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div class="h-full bg-primary transition-all duration-1000 ease-out" 
                           [style.width.%]="page.qualityScore || 0"></div>
                   </div>
                   <div class="text-[10px] font-black tracking-tighter text-slate-200">
                     {{ (page.qualityScore || 0) | number:'1.0-0' }}%
                   </div>
                </div>
              </td>
              <td class="text-center">
                <div class="inline-flex px-2 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[8px] font-black text-slate-600 uppercase tracking-widest group-hover:text-primary transition-all">
                  {{ page.status }}
                </div>
              </td>
              <td class="text-right">
                <button pButton 
                        label="Review" 
                        icon="pi pi-bolt" 
                        [routerLink]="['/review', page.id]"
                        class="!h-8 !px-4 !bg-primary/10 !border-primary/20 !text-primary hover:!bg-primary hover:!text-white transition-all shadow-md"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-datatable-custom {
        .p-datatable-thead > tr > th {
          background: rgba(15, 23, 42, 0.4) !important;
          color: #64748b !important;
        }
        .p-datatable-tbody > tr {
          background: transparent !important;
        }
        .p-paginator {
          background: rgba(15, 23, 42, 0.6) !important;
          border: none !important;
          border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
          padding: 1.5rem !important;

          .p-paginator-page, .p-paginator-next, .p-paginator-last, .p-paginator-first, .p-paginator-prev {
            color: #64748b !important;
            border-radius: 10px !important;
            min-width: 2.5rem !important;
            height: 2.5rem !important;
            margin: 0 0.25rem !important;
            font-weight: 800 !important;
            font-size: 11px !important;
            
            &.p-highlight {
              background: rgba(99, 102, 241, 0.2) !important;
              color: #6366f1 !important;
              border: 1px solid rgba(99, 102, 241, 0.3) !important;
            }
          }
        }
      }
    }
  `]
})
export class ReviewQueueComponent implements OnInit {
  private api = inject(ApiService);
  
  pages: (Page & { project?: { id: string; name: string } })[] = [];
  loading = false;
  filterTerm = '';

  ngOnInit() {
    this.loadQueue();
  }

  loadQueue() {
    this.loading = true;
    this.api.getReviewQueue().subscribe({
      next: (pages) => {
        this.pages = pages;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get filteredPages() {
    return this.pages.filter(p => 
      !this.filterTerm || p.project?.name.toLowerCase().includes(this.filterTerm.toLowerCase())
    );
  }

  getPriorityColor(priority: string): string {
    const map: Record<string, string> = {
      'URGENT': 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
      'HIGH': 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
      'NORMAL': 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
      'LOW': 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
    };
    return map[priority] || '#334155';
  }

  getScoreColor(score: number): string {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 75) return 'text-amber-400';
    return 'text-rose-400';
  }
}