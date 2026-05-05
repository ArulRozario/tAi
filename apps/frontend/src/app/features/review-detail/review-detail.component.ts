import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ApiService, Page } from '../../core/services/api.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-review-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule],
  template: `
    <div class="absolute inset-0 top-14 flex overflow-hidden bg-slate-950 animate-fade-in">
      <!-- SEGMENT NAVIGATION (Slim) -->
      <div class="w-64 border-r border-white/5 bg-slate-950/40 flex flex-col">
        <div class="p-3 border-b border-white/5 flex items-center justify-between">
           <span class="micro-label">Segment Grid</span>
           <span class="text-[8px] font-black text-primary">{{ completedSegments }}/{{ segments.length }}</span>
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <div *ngFor="let seg of segments; let i = index" 
               (click)="selectSegment(i)"
               [class]="'p-2 rounded-lg cursor-pointer transition-all flex items-center justify-between group ' + 
                         (selectedSegmentIndex === i ? 'bg-primary/10 border border-primary/30' : 'hover:bg-white/5 border border-transparent')">
            <div class="flex items-center gap-2">
               <div [class]="'w-1 h-1 rounded-full ' + (seg.status === 'GOOD' ? 'bg-emerald-500' : seg.status === 'ERROR' ? 'bg-rose-500' : 'bg-amber-500')"></div>
               <span class="text-[10px] font-black tracking-tight" [class.text-primary]="selectedSegmentIndex === i">Unit {{ i + 1 }}</span>
            </div>
            <i class="pi pi-chevron-right text-[7px] text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"></i>
          </div>
        </div>
      </div>

      <!-- WORKSPACE (Central) -->
      <div class="flex-1 flex flex-col bg-slate-950/20 relative">
        <!-- Workbench Toolbar -->
        <header class="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-slate-950/40 backdrop-blur-xl">
          <div class="flex items-center gap-3">
             <div class="px-2 py-1 bg-white/5 rounded border border-white/5">
                <span class="micro-label !text-slate-500">Unit {{ selectedSegmentIndex + 1 }}</span>
             </div>
             <h2 class="text-xs font-black text-white tracking-tight">{{ project?.name }} &bull; Page {{ page?.pageNumber }}</h2>
          </div>
          <div class="flex items-center gap-2">
             <button pButton icon="pi pi-chevron-left" class="!w-8 !h-8 !p-0 !bg-white/5 !border-none !text-slate-500 hover:!text-white"></button>
             <button pButton icon="pi pi-chevron-right" class="!w-8 !h-8 !p-0 !bg-white/5 !border-none !text-slate-500 hover:!text-white"></button>
             <div class="w-px h-4 bg-white/5 mx-2"></div>
             <button pButton label="Save Changes" icon="pi pi-check" class="!h-8 !px-4 !bg-primary !border-none !text-[9px]"></button>
          </div>
        </header>

        <!-- Document Views -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div class="grid grid-cols-2 gap-4 h-full min-h-[400px]">
             <!-- Source -->
             <div class="glass-card !bg-slate-950/40 border-white/5 flex flex-col overflow-hidden">
                <div class="p-2 border-b border-white/5 flex items-center justify-between bg-slate-950/60">
                   <span class="micro-label">Source Transcript</span>
                   <span class="text-[7px] font-black text-slate-700 uppercase tracking-widest">ENG-US</span>
                </div>
                <div class="p-6 flex-1 text-slate-200 text-base font-medium leading-relaxed selection:bg-primary/40">
                   {{ currentSegment?.original }}
                </div>
             </div>
             <!-- Synthesis -->
             <div class="glass-card !bg-slate-950/60 border-primary/20 flex flex-col overflow-hidden shadow-2xl">
                <div class="p-2 border-b border-white/5 flex items-center justify-between bg-slate-950/80">
                   <span class="micro-label !text-primary">Neural Synthesis</span>
                   <span class="text-[7px] font-black text-primary uppercase tracking-widest">TAM-IN</span>
                </div>
                <div class="p-6 flex-1 text-white text-base font-bold leading-relaxed selection:bg-primary/40 focus:outline-none" contenteditable="true">
                   {{ currentSegment?.translated }}
                </div>
             </div>
          </div>

          <!-- Diagnostic Overlay -->
          <div class="glass-card !bg-rose-500/5 border-rose-500/20 p-4" *ngIf="currentSegment?.error">
             <div class="flex items-center gap-3 mb-3">
                <i class="pi pi-exclamation-triangle text-rose-500 text-xs"></i>
                <span class="micro-label !text-rose-500">Neural Integrity Warning</span>
             </div>
             <div class="grid grid-cols-3 gap-6">
                <div class="space-y-1">
                   <span class="micro-label opacity-40">Current Token</span>
                   <p class="text-[10px] font-black text-slate-300 italic">"{{ currentSegment?.error?.current }}"</p>
                </div>
                <div class="space-y-1">
                   <span class="micro-label opacity-40">Proposed Refinement</span>
                   <p class="text-[10px] font-black text-emerald-400 italic">"{{ currentSegment?.error?.shouldBe }}"</p>
                </div>
                <div class="flex items-end justify-end">
                   <button pButton label="Apply Neural Patch" class="!h-7 !px-3 !bg-rose-500/20 !border-rose-500/40 !text-rose-400 !text-[8px] hover:!bg-rose-500 hover:!text-white"></button>
                </div>
             </div>
             <div class="mt-3 pt-3 border-t border-rose-500/10">
                <p class="text-[9px] text-rose-500/60 leading-relaxed font-medium">Analysis: {{ currentSegment?.error?.analysis }}</p>
             </div>
          </div>
        </div>
      </div>

      <!-- DIAGNOSTIC RAIL (Right) -->
      <div class="w-72 border-l border-white/5 bg-slate-950/40 flex flex-col">
        <div class="p-3 border-b border-white/5">
           <span class="micro-label">Quality Diagnostics</span>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
           <!-- Fidelity Score -->
           <div class="text-center p-4 glass-card !bg-slate-950/40 border-white/5 relative group">
              <div class="text-[8px] font-black text-slate-600 uppercase mb-2">Fidelity Score</div>
              <div class="text-3xl font-black text-primary tracking-tighter">{{ pageQuality }}%</div>
              <div class="w-full h-1 bg-slate-900 rounded-full mt-3 overflow-hidden shadow-inner">
                 <div class="bg-primary h-full transition-all duration-1000" [style.width.%]="pageQuality"></div>
              </div>
           </div>

           <!-- Multi-Vector Breakdown -->
           <div class="space-y-3">
              <span class="micro-label px-1">Integrity Vectors</span>
              <div class="space-y-3">
                 <div *ngFor="let item of qualityBreakdown" class="space-y-1.5">
                    <div class="flex justify-between text-[8px] font-black uppercase tracking-widest">
                       <span class="text-slate-600">{{ item.label }}</span>
                       <span class="text-slate-300">{{ item.score }}%</span>
                    </div>
                    <div class="w-full h-0.5 bg-slate-900 rounded-full">
                       <div class="bg-slate-700 h-full" [style.width.%]="item.score"></div>
                    </div>
                 </div>
              </div>
           </div>

           <!-- Finalization -->
           <div class="pt-4 space-y-2">
              <span class="micro-label px-1">Lifecycle Action</span>
              <button pButton label="Verify & Commit" icon="pi pi-check-circle" class="w-full !h-10 !bg-emerald-500/10 !border-emerald-500/20 !text-emerald-500 hover:!bg-emerald-500 hover:!text-white"></button>
              <button pButton label="Escalate to Master" icon="pi pi-shield" class="w-full !h-10 !bg-slate-900 !border-white/5 !text-slate-600 hover:!text-white"></button>
           </div>
        </div>
      </div>
    </div>
  `,
})
export class ReviewDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  page: Page | null = null;
  project: any = null;
  segments: any[] = [];
  selectedSegmentIndex = 0;
  pageQuality = 78;
  qualityBreakdown = [
    { label: 'Accuracy', score: 85 },
    { label: 'Fluency', score: 70 },
    { label: 'Style', score: 65 },
    { label: 'Terms', score: 90 },
  ];

  ngOnInit() {
    const pageId = this.route.snapshot.params['id'];
    this.loadPage(pageId);
  }

  loadPage(id: string) {
    this.api.getPage(id).subscribe({
      next: (page) => {
        this.page = page;
        this.loadProject(page.projectId);
        this.generateMockSegments();
      }
    });
  }

  loadProject(id: string) {
    this.api.getProject(id).subscribe({
      next: (project) => this.project = project
    });
  }

  generateMockSegments() {
    // Mocking segments since they aren't in the DB yet
    this.segments = Array.from({ length: 25 }, (_, i) => ({
      id: `seg-${i}`,
      original: `English text for segment ${i + 1}...`,
      translated: `Tamil translation for segment ${i + 1}...`,
      status: i % 3 === 0 ? 'ERROR' : i % 2 === 0 ? 'GOOD' : 'REVIEW',
      error: i % 3 === 0 ? {
        category: 'Terminology',
        current: 'Common Tamil word',
        shouldBe: 'Thiruviviliam term',
        analysis: 'Modern Tamil used instead of biblical style.'
      } : null
    }));
  }

  get currentSegment() {
    return this.segments[this.selectedSegmentIndex];
  }

  selectSegment(index: number) {
    this.selectedSegmentIndex = index;
  }

  getSegmentIcon(status: string): string {
    if (status === 'GOOD') return 'pi pi-check-circle text-success';
    if (status === 'ERROR') return 'pi pi-exclamation-triangle text-error';
    return 'pi pi-circle text-warning';
  }

  get completedSegments() {
    return this.segments.filter(s => s.status === 'GOOD').length;
  }
}