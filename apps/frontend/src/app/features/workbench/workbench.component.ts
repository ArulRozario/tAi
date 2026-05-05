import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ApiService, Project, Page } from '../../core/services/api.service';

@Component({
  selector: 'app-workbench',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule, TooltipModule],
  template: `
    <div class="absolute inset-0 top-14 flex gap-4 p-4 animate-fade-in overflow-hidden bg-slate-950">
      <!-- LEFT SIDEBAR: Document Intelligence Explorer (Compact) -->
      <aside class="w-64 flex flex-col shrink-0 gap-4">
        <div class="glass-card flex-1 flex flex-col overflow-hidden border-white/5 bg-slate-900/20">
          <div class="p-3 border-b border-white/5 bg-slate-950/40">
            <div class="flex items-center justify-between mb-3">
               <span class="micro-label">Unit Index</span>
               <span class="text-[8px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10">{{ pages.length }} UNITS</span>
            </div>
            <div class="relative group">
              <i class="pi pi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-700 text-[8px]"></i>
              <input type="text" placeholder="Filter Units..." 
                     class="w-full bg-slate-950/60 border border-white/5 rounded-lg py-1.5 pl-8 pr-2 text-[9px] outline-none transition-all placeholder:text-slate-800 font-bold focus:border-primary/40" />
            </div>
          </div>
          
          <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <div *ngFor="let page of pages" 
                 (click)="selectPage(page)"
                 [class]="'p-2 rounded-lg cursor-pointer transition-all border flex items-center gap-3 ' + 
                          (selectedPage?.id === page.id ? 'bg-primary/5 border-primary/20' : 'bg-transparent border-transparent hover:bg-white/5')">
              <div [class]="'w-7 h-7 rounded-md flex items-center justify-center font-black text-[9px] ' + 
                             (selectedPage?.id === page.id ? 'bg-primary text-white' : 'bg-slate-900 text-slate-700')">
                {{ page.pageNumber }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center mb-1">
                   <span class="text-[7px] font-black text-slate-600 uppercase tracking-widest">{{ page.status }}</span>
                   <span class="text-[7px] font-black text-primary">{{ page.qualityScore || 0 }}%</span>
                </div>
                <div class="w-full h-0.5 bg-slate-900 rounded-full overflow-hidden">
                  <div class="h-full bg-primary" [style.width.%]="page.qualityScore || 0"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Stability Pulse -->
          <div class="p-3 border-t border-white/5 bg-slate-950/40">
            <span class="micro-label mb-2 block">Neural Stability</span>
            <div class="flex items-end gap-0.5 h-4 px-1">
              <div *ngFor="let h of [40, 70, 45, 90, 65, 85, 50, 75]" 
                   class="flex-1 bg-primary/20 rounded-t-[1px]"
                   [style.height.%]="h"></div>
            </div>
          </div>
        </div>
      </aside>

      <!-- MAIN INTELLIGENCE WORKSPACE (Expanded) -->
      <div class="flex-1 flex flex-col gap-4 min-w-0">
        <div class="flex-1 flex flex-col glass-card border-white/5 bg-slate-900/20 overflow-hidden">
          <!-- Toolbar (Slim) -->
          <header class="h-12 px-4 flex items-center justify-between border-b border-white/5 bg-slate-950/40">
            <div class="flex items-center gap-4">
              <button pButton icon="pi pi-arrow-left" routerLink="/projects" 
                      class="!p-0 !w-8 !h-8 !bg-transparent !border-none !text-slate-700 hover:!text-white"></button>
              <div class="flex flex-col">
                <h1 class="text-xs font-black text-white tracking-tight leading-none mb-0.5">{{ projectName }}</h1>
                <div class="flex items-center gap-1.5">
                  <span class="text-[7px] font-black text-slate-700 uppercase tracking-widest">Protocol Matrix Active</span>
                  <div class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <div class="flex bg-slate-950/60 p-1 rounded-lg border border-white/5">
                <button pButton icon="pi pi-clone" (click)="viewMode = 'split'"
                        [class]="'!p-0 !w-7 !h-7 transition-all !rounded !border-none ' + (viewMode === 'split' ? '!bg-primary/20 !text-primary' : '!bg-transparent !text-slate-700')"></button>
                <button pButton icon="pi pi-stop" (click)="viewMode = 'focus'"
                        [class]="'!p-0 !w-7 !h-7 transition-all !rounded !border-none ' + (viewMode === 'focus' ? '!bg-primary/20 !text-primary' : '!bg-transparent !text-slate-700')"></button>
              </div>
              <button pButton label="Sync Pipeline" icon="pi pi-bolt" [loading]="translating"
                      class="!bg-primary !border-none !h-7 !px-4 !text-[8px] font-black uppercase tracking-widest"></button>
            </div>
          </header>

          <!-- Split Viewport (Content-Focused) -->
          <div class="flex-1 flex gap-px bg-white/5 min-h-0">
            <section class="flex-1 flex flex-col bg-slate-950/40 overflow-hidden">
              <div class="p-2 border-b border-white/5 flex justify-between items-center bg-slate-950/60">
                <span class="micro-label">Source Protocol</span>
                <span class="text-[7px] font-black text-slate-700 uppercase tracking-widest">ENG-US</span>
              </div>
              <div class="flex-1 p-6 overflow-y-auto custom-scrollbar font-serif text-sm leading-relaxed text-slate-400 selection:bg-primary/20">
                {{ selectedPage?.originalText || 'Initializing neural buffer...' }}
              </div>
            </section>

            <section class="flex-1 flex flex-col bg-slate-950/60 overflow-hidden border-l border-white/5">
              <div class="p-2 border-b border-white/5 bg-slate-950/80 flex justify-between items-center">
                <span class="micro-label !text-primary">Synthesis Output</span>
                <div class="flex items-center gap-3">
                  <span class="text-[7px] font-black text-primary uppercase tracking-widest">Conf: {{ selectedPage?.qualityScore || 0 }}%</span>
                  <i class="pi pi-sparkles text-[8px] text-primary/40"></i>
                </div>
              </div>
              <div class="flex-1 p-6 overflow-y-auto custom-scrollbar font-serif text-base font-bold leading-relaxed text-slate-100 selection:bg-primary/20">
                <p *ngIf="selectedPage?.translatedText; else emptyTranslation" class="animate-fade-in">
                  {{ selectedPage?.translatedText }}
                </p>
                <ng-template #emptyTranslation>
                  <div class="h-full flex flex-col items-center justify-center text-center opacity-5 py-10 space-y-2">
                    <i class="pi pi-bolt text-4xl"></i>
                    <p class="text-[8px] font-black uppercase tracking-[0.3em]">Ready for Matrix Sync</p>
                  </div>
                </ng-template>
              </div>
            </section>
          </div>
        </div>

        <!-- Command Terminal (Ultra-Compact) -->
        <div class="h-16 glass-card p-2 flex gap-3 items-center border-white/5 bg-slate-950 shadow-xl relative overflow-hidden">
          <div class="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shrink-0">
            <i class="pi pi-terminal text-sm"></i>
          </div>
          <div class="flex-1 relative h-full">
            <textarea placeholder="Neural override instructions..." 
                      class="w-full bg-slate-900/40 border border-white/5 rounded-lg p-2.5 text-[10px] font-serif italic outline-none focus:border-primary/40 transition-all h-full resize-none custom-scrollbar pb-5"></textarea>
            <div class="absolute right-2 bottom-1 text-[6px] font-black text-slate-800 uppercase tracking-widest">⌘+⏎ to commit</div>
          </div>
          <button pButton icon="pi pi-send" 
                  class="!w-10 !h-10 !rounded-lg !bg-primary !border-none shrink-0"></button>
        </div>
      </div>

      <!-- RIGHT SIDEBAR: Diagnostics (Compact) -->
      <aside class="w-64 flex flex-col shrink-0 gap-4">
        <div class="glass-card flex-1 p-5 border-white/5 bg-slate-900/20 flex flex-col gap-6">
          <section>
            <span class="micro-label mb-3 block">Neural Fidelity</span>
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-2xl font-black text-primary tracking-tighter">84<span class="text-xs opacity-40">%</span></span>
                <span class="text-[7px] font-black text-slate-700 uppercase tracking-widest">Page Precision</span>
              </div>
              <div class="w-10 h-10 rounded-full border border-slate-900 flex items-center justify-center relative">
                <svg class="absolute inset-0 -rotate-90">
                  <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="1.5" class="text-primary" stroke-dasharray="113" stroke-dashoffset="18"></circle>
                </svg>
                <i class="pi pi-verified text-[10px] text-primary"></i>
              </div>
            </div>
          </section>

          <section class="flex-1 flex flex-col gap-3 min-h-0">
            <span class="micro-label">Reasoning Logic</span>
            <div class="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              <div *ngFor="let i of [1,2,3,4]" class="p-2 rounded-lg bg-slate-950/60 border border-white/5 text-[8px] text-slate-600 leading-normal italic">
                "Segment analysis suggests formal semantic alignment within current matrix parameters."
              </div>
            </div>
          </section>

          <!-- Status Overlay (Slim) -->
          <div class="pt-3 border-t border-white/5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></div>
                <span class="text-[7px] font-black text-emerald-500/60 uppercase tracking-widest">Synced</span>
              </div>
              <i class="pi pi-database text-slate-900 text-[8px]"></i>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .custom-scrollbar::-webkit-scrollbar { width: 2px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
    }
  `]
})
export class WorkbenchComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  projectId!: string;
  projectName = 'Loading...';
  pages: Page[] = [];
  selectedPage: Page | null = null;
  translating = false;
  viewMode: 'split' | 'focus' = 'split';

  ngOnInit() {
    this.projectId = this.route.snapshot.params['id'];
    this.loadProject();
  }

  loadProject() {
    this.api.getProject(this.projectId).subscribe({
      next: (project) => {
        this.projectName = project.name;
        this.loadPages();
      },
      error: () => {
        this.projectName = 'Unknown Project';
      }
    });
  }

  loadPages() {
    this.api.getProjectPages(this.projectId).subscribe({
      next: (res) => {
        this.pages = res.data;
        if (this.pages.length > 0) {
          this.selectPage(this.pages[0]);
        }
      }
    });
  }

  selectPage(page: Page) {
    this.selectedPage = page;
  }
}