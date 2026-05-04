import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ApiService, Page } from '../../core/services/api.service';

@Component({
  selector: 'app-review-queue',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, TagModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Review Queue</h1>
      </div>

      <p-table 
        [value]="pages" 
        [loading]="loading"
        [paginator]="true"
        [rows]="20"
        styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
          <tr>
            <th>Project</th>
            <th>Page #</th>
            <th>Priority</th>
            <th>Quality</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-page>
          <tr>
            <td>
              <a [routerLink]="['/projects', page.projectId]" class="text-accent hover:underline">
                {{ page.project?.name }}
              </a>
            </td>
            <td>{{ page.pageNumber }}</td>
            <td>
              <p-tag [value]="page.priority" [severity]="getPrioritySeverity(page.priority)"></p-tag>
            </td>
            <td>
              <span *ngIf="page.qualityScore" class="font-bold" [class]="getScoreColor(page.qualityScore)">
                {{ page.qualityScore | number:'1.0-0' }}%
              </span>
              <span *ngIf="!page.qualityScore" class="text-gray-500">-</span>
            </td>
            <td>
              <p-tag [value]="page.status" [severity]="getStatusSeverity(page.status)"></p-tag>
            </td>
            <td>
              <button pButton label="Review" icon="pi pi-eye" [routerLink]="['/review', page.id]"></button>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" class="text-center py-8 text-gray-400">
              No pages in review queue.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `
})
export class ReviewQueueComponent implements OnInit {
  private api = inject(ApiService);
  
  pages: (Page & { project?: { id: string; name: string } })[] = [];
  loading = false;

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

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'danger' | 'warn' | 'info' | 'secondary'> = {
      'URGENT': 'danger',
      'HIGH': 'warn',
      'NORMAL': 'info',
      'LOW': 'secondary',
    };
    return map[priority] || 'secondary';
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'info' | 'warn' | 'success'> = {
      'REVIEWING': 'warn',
      'HUMAN_REVIEW': 'info',
      'APPROVED': 'success',
    };
    return map[status] || 'secondary';
  }

  getScoreColor(score: number): string {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    return 'text-red-400';
  }
}