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
    <div class="flex h-screen overflow-hidden bg-background">
      <!-- LEFT SIDEBAR: Segment List -->
      <div class="w-64 bg-primary border-r border-border flex flex-col">
        <div class="p-4 border-b border-border">
          <a routerLink="/queue" class="flex items-center gap-2 text-text-secondary hover:text-accent text-sm transition-colors">
            <i class="pi pi-arrow-left"></i> Back to Queue
          </a>
        </div>
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
          <div class="text-xs font-bold text-text-secondary uppercase tracking-widest px-2 mb-3">Segments</div>
          <div *ngFor="let seg of segments; let i = index" 
               (click)="selectSegment(i)"
               [class]="'p-3 rounded-lg cursor-pointer transition-all flex items-center justify-between ' + 
                         (selectedSegmentIndex === i ? 'bg-accent text-white shadow-lg scale-105' : 'bg-secondary text-text-secondary hover:bg-surface')">
            <span class="text-sm font-medium">Segment {{ i + 1 }}</span>
            <i [class]="getSegmentIcon(seg.status)" class="text-xs"></i>
          </div>
        </div>
        <div class="p-4 border-t border-border">
          <div class="flex justify-between items-center text-xs text-text-secondary">
            <span>Progress:</span>
            <span>{{ completedSegments }} / {{ segments.length }}</span>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT: Translation Analysis -->
      <div class="flex-1 flex flex-col bg-background">
        <!-- Top Header -->
        <div class="h-16 bg-primary border-b border-border flex items-center justify-between px-6">
          <div class="flex items-center gap-4">
            <span class="text-text-primary font-medium">Page {{ page?.pageNumber }} - {{ project?.name }}</span>
            <span class="text-text-secondary">|</span>
            <span class="text-text-primary font-bold">Detailed Review</span>
          </div>
          <div class="flex items-center gap-3">
            <button pButton label="Skip" icon="pi pi-times" class="p-button-text p-button-sm"></button>
            <button pButton label="Save Changes" icon="pi pi-save" class="p-button-sm bg-accent border-none"></button>
            <button pButton label="Next Page" icon="pi, pi-arrow-right" class="p-button-sm bg-accent border-none"></button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-8 space-y-8">
          <!-- Side-by-Side Comparison -->
          <div class="grid grid-cols-2 gap-6">
            <div class="bg-secondary rounded-xl border border-border overflow-hidden">
              <div class="bg-primary p-3 border-b border-border text-xs font-bold uppercase tracking-widest text-text-secondary">
                English (Original)
              </div>
              <div class="p-6 text-text-primary leading-relaxed text-lg">
                {{ currentSegment?.original }}
              </div>
            </div>
            <div class="bg-secondary rounded-xl border border-border overflow-hidden">
              <div class="bg-accent p-3 border-b border-border text-xs font-bold uppercase tracking-widest text-white">
                Tamil (Translated)
              </div>
              <div class="p-6 text-text-primary leading-relaxed text-lg">
                {{ currentSegment?.translated }}
              </div>
            </div>
          </div>

          <!-- Detailed Error Analysis -->
          <div class="bg-secondary rounded-xl border border-border overflow-hidden">
            <div class="bg-primary p-3 border-b border-border text-xs font-bold uppercase tracking-widest text-text-secondary">
              Error Analysis: Segment {{ selectedSegmentIndex + 1 }}
            </div>
            <div class="p-6 space-y-6">
              <div *ngIf="currentSegment?.error" class="bg-primary p-6 rounded-lg border border-border space-y-4">
                <div class="flex items-center gap-2 text-error font-bold uppercase text-xs">
                  <i class="pi pi-exclamation-triangle"></i> {{ currentSegment?.error?.category }} Error
                </div>
                <div class="grid grid-cols-2 gap-8">
                  <div>
                    <div class="text-xs text-text-secondary mb-1">Current Translation:</div>
                    <div class="text-sm text-text-primary italic">"{{ currentSegment?.error?.current }}"</div>
                  </div>
                  <div>
                    <div class="text-xs text-text-secondary mb-1">Suggested:</div>
                    <div class="text-sm text-accent font-bold italic">"{{ currentSegment?.error?.shouldBe }}"</div>
                  </div>
                </div>
                <div class="p-4 bg-surface rounded border border-border text-sm text-text-secondary italic">
                  {{ currentSegment?.error?.analysis }}
                </div>
                <div class="flex gap-3">
                  <button pButton label="Apply Suggestion" class="p-button-sm bg-success border-none"></button>
                  <button pButton label="Edit Manually" class="p-button-sm bg-secondary border-border text-text-primary"></button>
                </div>
              </div>
              <div *ngIf="!currentSegment?.error" class="text-center py-12 text-text-secondary">
                <i class="pi pi-check-circle text-3xl text-success mb-3 block"></i>
                No critical errors detected for this segment.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT INSPECTOR PANEL -->
      <div class="w-80 bg-secondary border-l border-border flex flex-col">
        <div class="p-4 border-b border-border">
          <h3 class="text-sm font-bold uppercase tracking-widest text-text-secondary">Quality Panel</h3>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <!-- Overall Score -->
          <div class="text-center p-6 bg-primary rounded-xl border border-border">
            <div class="text-xs text-text-secondary uppercase mb-2">Overall Quality</div>
            <div class="text-4xl font-bold text-accent">{{ pageQuality }}%</div>
            <div class="w-full h-2 bg-surface rounded-full mt-4 overflow-hidden">
              <div class="bg-accent h-full" [style.width.%]="pageQuality"></div>
            </div>
          </div>

          <!-- Breakdown -->
          <div class="space-y-3">
            <div class="text-xs text-text-secondary uppercase font-bold">Breakdown</div>
            <div class="space-y-2">
              <div *ngFor="let item of qualityBreakdown" class="flex justify-between items-center text-xs">
                <span class="text-text-secondary">{{ item.label }}</span>
                <span class="text-text-primary font-mono">{{ item.score }}%</span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="space-y-3 pt-4">
            <div class="text-xs text-text-secondary uppercase font-bold">Final Action</div>
            <button pButton label="Approve Page" icon="pi pi-check" class="w-full p-button-sm bg-success border-none"></button>
            <button pButton label="Request Changes" icon="pi pi-refresh" class="w-full p-button-sm bg-warning border-none"></button>
            <button pButton label="Escalate to Master" icon="pi pi-upload" class="w-full p-button-sm bg-secondary border-border text-text-primary"></button>
          </div>
        </div>
      </div>
    </div>
  `
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