import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ApiService, Page } from '../../core/services/api.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-workbench',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule],
  template: `
    <div class="flex h-screen overflow-hidden bg-background">
      <!-- LEFT SIDEBAR: Page List -->
      <div class="w-64 bg-primary border-r border-border flex flex-col">
        <div class="p-4 border-b border-border">
          <a routerLink="/projects" class="flex items-center gap-2 text-text-secondary hover:text-accent text-sm transition-colors">
            <i class="pi pi-arrow-left"></i> Back to Projects
          </a>
        </div>
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
          <div class="text-xs font-bold text-text-secondary uppercase tracking-widest px-2 mb-3">Pages</div>
          <div *ngFor="let page of pages" 
               (click)="selectPage(page)"
               [class]="'p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 ' + 
                         (selectedPage?.id === page.id ? 'bg-accent text-white shadow-lg scale-105' : 'bg-secondary text-text-secondary hover:bg-surface')">
            <span class="w-6 h-6 rounded-full bg-surface text-center text-xs flex items-center justify-center font-bold">
              {{ page.pageNumber }}
            </span>
            <span class="text-sm truncate">{{ page.status }}</span>
          </div>
        </div>
      </div>

      <!-- MAIN WORKSPACE -->
      <div class="flex-1 flex flex-col bg-background">
        <!-- Top Header -->
        <div class="h-16 bg-primary border-b border-border flex items-center justify-between px-6">
          <div class="flex items-center gap-4">
            <span class="text-text-primary font-medium">Project: {{ projectName }}</span>
            <span class="text-text-secondary">|</span>
            <span class="text-text-primary font-bold">Page {{ selectedPage?.pageNumber || '...' }}</span>
          </div>
          <div class="flex items-center gap-3">
            <button pButton label="Zoom 100%" icon="pi pi-search-plus" class="p-button-text p-button-sm"></button>
            <button pButton label="Fit Width" icon="pi pi-arrows-alt-h" class="p-button-text p-button-sm"></button>
            <button pButton label="Side by Side" icon="pi pi-columns" class="p-button-sm bg-accent border-none"></button>
          </div>
        </div>

        <!-- Side-by-Side Viewers -->
        <div class="flex-1 flex p-4 gap-4 overflow-hidden">
          <div class="flex-1 bg-surface rounded-xl border border-border overflow-y-auto p-6 relative group">
            <div class="absolute top-4 left-4 bg-primary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-text-secondary">Original (English)</div>
            <div class="mt-8 prose prose-invert max-w-none">
              <p class="text-text-primary leading-relaxed whitespace-pre-wrap">{{ selectedPage?.originalText || 'No content extracted yet...' }}</p>
            </div>
          </div>
          <div class="flex-1 bg-surface rounded-xl border border-border overflow-y-auto p-6 relative group">
            <div class="absolute top-4 left-4 bg-accent px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-white">Translation (Tamil)</div>
            <div class="mt-8 prose prose-invert max-w-none">
              <p class="text-text-primary leading-relaxed whitespace-pre-wrap">{{ selectedPage?.translatedText || 'Translating...' }}</p>
            </div>
          </div>
        </div>

        <!-- Bottom Analysis Section -->
        <div class="h-64 bg-secondary border-t border-border p-6 overflow-y-auto">
          <div class="flex items-center gap-2 text-text-secondary uppercase text-xs font-bold tracking-wider mb-4">
            <i class="pi pi-info-circle text-accent"></i> Extraction Details
          </div>
          <div class="bg-primary p-4 rounded-lg border border-border">
            <div class="grid grid-cols-2 gap-8">
              <div>
                <div class="text-xs text-text-secondary mb-1">Original Segment</div>
                <div class="text-sm text-text-primary italic">"{{ selectedPage?.originalText?.substring(0, 100) }}..."</div>
              </div>
              <div>
                <div class="text-xs text-text-secondary mb-1">Translation Segment</div>
                <div class="text-sm text-accent italic">"{{ selectedPage?.translatedText?.substring(0, 100) }}..."</div>
              </div>
            </div>
            <div class="mt-4 flex items-center gap-4">
              <div class="text-xs text-text-secondary">Confidence:</div>
              <div class="w-48 h-2 bg-surface rounded-full overflow-hidden">
                <div class="bg-accent h-full" style="width: 80%"></div>
              </div>
              <div class="text-xs font-mono text-accent">80%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT INSPECTOR PANEL -->
      <div class="w-80 bg-secondary border-l border-border flex flex-col">
        <div class="p-4 border-b border-border">
          <h3 class="text-sm font-bold uppercase tracking-widest text-text-secondary">Inspector</h3>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          <!-- Page Info -->
          <div class="space-y-2">
            <div class="text-xs text-text-secondary uppercase font-bold">Page Info</div>
            <div class="bg-primary p-3 rounded-lg border border-border space-y-2">
              <div class="flex justify-between text-xs">
                <span class="text-text-secondary">Status:</span>
                <p-tag [value]="selectedPage?.status" [severity]="getStatusSeverity(selectedPage?.status)" class="text-[10px]"></p-tag>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-text-secondary">Assigned:</span>
                <span class="text-text-primary">Me</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-text-secondary">Quality:</span>
                <span class="text-accent font-bold">78%</span>
              </div>
            </div>
          </div>

          <!-- Translation Feedback -->
          <div class="space-y-2">
            <div class="text-xs text-text-secondary uppercase font-bold">AI Feedback</div>
            <div class="bg-primary p-3 rounded-lg border border-border text-xs text-text-primary leading-relaxed italic">
              "Good style, but consider changing 'faith' to 'விசுவாசம்' to match Thiruviviliam terminology."
            </div>
          </div>

          <!-- Actions -->
          <div class="space-y-3 pt-4">
            <div class="text-xs text-text-secondary uppercase font-bold">Actions</div>
            <button pButton label="Approve" icon="pi pi-check" class="w-full p-button-sm bg-success border-none"></button>
            <button pButton label="Changes" icon="pi pi-refresh" class="w-full p-button-sm bg-warning border-none"></button>
            <button pButton label="Reassign" icon="pi pi-user-edit" class="w-full p-button-sm bg-secondary border-border text-text-primary"></button>
          </div>
        </div>

        <div class="p-4 border-t border-border bg-primary text-center">
          <div class="text-[10px] text-text-secondary">Last save: 2 min ago</div>
        </div>
      </div>
    </div>
  `
})
export class WorkbenchComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  projectId!: string;
  projectName = 'Loading...';
  pages: Page[] = [];
  selectedPage: Page | null = null;

  ngOnInit() {
    this.projectId = this.route.snapshot.params['id'];
    this.loadProject();
  }

  loadProject() {
    this.api.getProject(this.projectId).subscribe({
      next: (project) => {
        this.projectName = project.name;
        this.loadPages();
      }
    });
  }

  loadPages() {
    this.api.getPagesByProject(this.projectId).subscribe({
      next: (pages) => {
        this.pages = pages;
        if (this.pages.length > 0) {
          this.selectPage(this.pages[0]);
        }
      }
    });
  }

  selectPage(page: Page) {
    this.selectedPage = page;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'info' | 'warn' | 'secondary'> = {
      'APPROVED': 'success',
      'PROCESSING': 'info',
      'REVIEWING': 'warn',
      'PENDING': 'secondary',
    };
    return map[status] || 'secondary';
  }
}