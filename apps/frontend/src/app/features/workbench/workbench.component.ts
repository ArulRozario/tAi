import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { SplitterModule } from 'primeng/splitter';
import { TextareaModule } from 'primeng/textarea';
import { ApiService, Project, Page, ProjectStats } from '../../core/services/api.service';

@Component({
  selector: 'app-workbench',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    CardModule,
    SplitterModule,
    TextareaModule,
  ],
  template: `
    <div class="h-screen flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-gray-700 flex justify-between items-center">
        <div>
          <a routerLink="/projects" class="text-gray-400 hover:text-accent">← Projects</a>
          <h1 class="text-xl font-bold mt-2">{{ project?.name }}</h1>
        </div>
        <div class="flex gap-2">
          <button pButton label="Process All" icon="pi pi-play" (click)="processAll()"></button>
          <button pButton label="Export" icon="pi pi-download" class="p-button-secondary"></button>
        </div>
      </div>

      <!-- Stats -->
      <div class="flex gap-4 p-4 bg-surface">
        <div class="card">
          <span class="text-gray-400 text-sm">Total Pages</span>
          <span class="text-2xl font-bold">{{ stats?.total || 0 }}</span>
        </div>
        <div class="card">
          <span class="text-gray-400 text-sm">Translated</span>
          <span class="text-2xl font-bold text-success">{{ stats?.translated || 0 }}</span>
        </div>
        <div class="card">
          <span class="text-gray-400 text-sm">In Review</span>
          <span class="text-2xl font-bold text-warning">{{ stats?.humanReview || 0 }}</span>
        </div>
        <div class="card">
          <span class="text-gray-400 text-sm">Approved</span>
          <span class="text-2xl font-bold text-info">{{ stats?.approved || 0 }}</span>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 flex">
        <!-- Page List -->
        <div class="w-1/3 border-r border-gray-700 overflow-auto">
          <p-table 
            [value]="pages" 
            [selection]="selectedPage"
            (onRowSelect)="onPageSelect()"
            selectionMode="single"
            [scrollable]="true"
            scrollHeight="flex">
            <ng-template pTemplate="header">
              <tr>
                <th>#</th>
                <th>Status</th>
                <th>Score</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-page>
              <tr [pSelectableRow]="page">
                <td>{{ page.pageNumber }}</td>
                <td>
                  <p-tag [value]="page.status" [severity]="getPageStatusSeverity(page.status)"></p-tag>
                </td>
                <td>
                  <span *ngIf="page.qualityScore" class="text-sm">{{ page.qualityScore | number:'1.0-0' }}%</span>
                  <span *ngIf="!page.qualityScore" class="text-gray-500">-</span>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Translation View -->
        <div class="flex-1 flex flex-col">
          <p-splitter [panelSizes]="[50, 50]" styleClass="h-full">
            <ng-template pTemplate>
              <div class="p-4 overflow-auto h-full">
                <h3 class="text-lg font-semibold mb-4">Original (English)</h3>
                <textarea 
                  class="w-full h-full bg-surface border border-gray-700 rounded p-4 text-gray-300 resize-none"
                  [value]="selectedPage?.originalText || ''"
                  readonly
                  rows="20"></textarea>
              </div>
            </ng-template>
            <ng-template pTemplate>
              <div class="p-4 overflow-auto h-full">
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-lg font-semibold">Translation (Tamil)</h3>
                  <ng-container *ngIf="selectedPage?.qualityScore as score">
                    <div class="flex items-center gap-2">
                      <span class="text-gray-400">Quality:</span>
                      <span class="font-bold" [ngClass]="getScoreColor(score)">
                        {{ score | number:'1.0-0' }}%
                      </span>
                    </div>
                  </ng-container>
                </div>
                <textarea 
                  class="w-full h-full bg-surface border border-gray-700 rounded p-4 text-gray-300 resize-none"
                  [value]="selectedPage?.translatedText || ''"
                  readonly
                  rows="20"></textarea>
              </div>
            </ng-template>
          </p-splitter>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      @apply bg-surface px-4 py-2 rounded;
    }
    .text-success { color: #4ecca3; }
    .text-warning { color: #ffc107; }
    .text-info { color: #17a2b8; }
  `]
})
export class WorkbenchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  project: Project | null = null;
  pages: Page[] = [];
  stats: ProjectStats | null = null;
  selectedPage: Page | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProject(id);
      this.loadPages(id);
      this.loadStats(id);
    }
  }

  loadProject(id: string) {
    this.api.getProject(id).subscribe(p => this.project = p);
  }

  loadPages(id: string) {
    this.api.getProjectPages(id, 1, 100).subscribe(res => this.pages = res.data);
  }

  loadStats(id: string) {
    this.api.getProjectStats(id).subscribe(s => this.stats = s);
  }

  onPageSelect() {
    // Page selection handled by template
  }

  processAll() {
    // Would call the agent orchestrator
    console.log('Process all pages');
  }

  getPageStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'PENDING': 'secondary',
      'EXTRACTING': 'warn',
      'EXTRACTED': 'info',
      'TRANSLATING': 'warn',
      'TRANSLATED': 'info',
      'REVIEWING': 'warn',
      'HUMAN_REVIEW': 'info',
      'APPROVED': 'success',
      'REJECTED': 'danger',
      'ERROR': 'danger',
    };
    return map[status] || 'secondary';
  }

  getScoreColor(score: number): string {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-warning';
    return 'text-danger';
  }
}