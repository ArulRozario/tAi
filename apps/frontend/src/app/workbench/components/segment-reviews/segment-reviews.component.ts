import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { WorkbenchStateService } from '../../services/workbench-state.service';
import { SegmentReviewCorrection } from '../../services/submissions.service';

@Component({
  selector: 'app-segment-reviews',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, TagModule],
  template: `
    <div class="segment-reviews-panel">
      <div class="panel-header">
        <h3>
          <i class="pi pi-pencil"></i>
          Segment Corrections
          @if (corrections.length > 0) {
            <span class="badge">{{ corrections.length }}</span>
          }
        </h3>
      </div>

      @if (activeSegmentId()) {
        <div class="active-segment-info">
          <span class="segment-label">Segment</span>
          <code class="segment-id">{{ activeSegmentId() }}</code>
        </div>
      }

      @if (isLoading()) {
        <div class="empty-state">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading corrections…</p>
        </div>
      } @else if (corrections.length === 0) {
        <div class="empty-state">
          <i class="pi pi-inbox"></i>
          <p>No corrections for this segment</p>
        </div>
      } @else {
        <div class="correction-list">
          @for (corr of corrections; track corr.submissionId) {
            <div class="correction-card">
              <div class="correction-header">
                <div class="reviewer-info">
                  <span class="reviewer-avatar" [style.background]="getAvatarColor(corr.submittedBy.id)">
                    {{ (corr.submittedBy.name || corr.submittedBy.email).charAt(0).toUpperCase() }}
                  </span>
                  <span class="reviewer-name">{{ corr.submittedBy.name || corr.submittedBy.email }}</span>
                </div>
                <p-tag [value]="corr.status" [severity]="getStatusSeverity(corr.status)" />
              </div>

              <div class="correction-text">
                <p class="correction-label">Suggested text:</p>
                <blockquote>{{ corr.editedText }}</blockquote>
              </div>

              @if (corr.status === 'PENDING') {
                <div class="correction-actions">
                  <button
                    pButton
                    class="p-button-sm p-button-outlined"
                    icon="pi pi-check"
                    label="Use this text"
                    (click)="useText.emit(corr)"
                  ></button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./segment-reviews.component.scss'],
})
export class SegmentReviewsComponent {
  state = inject(WorkbenchStateService);

  @Input({ required: true }) corrections: SegmentReviewCorrection[] = [];
  @Output() useText = new EventEmitter<SegmentReviewCorrection>();

  activeSegmentId = computed(() => this.state.activeSegmentId());
  isLoading = computed(() => this.state.isLoadingSegmentCorrections());

  private readonly AVATAR_COLORS = [
    '#6366f1', '#ec4899', '#f59e0b', '#10b981',
    '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
  ];

  getAvatarColor(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.AVATAR_COLORS[Math.abs(hash) % this.AVATAR_COLORS.length];
  }

  getStatusSeverity(status: string) {
    switch (status) {
      case 'APPROVED': return 'success' as const;
      case 'REJECTED': return 'danger' as const;
      default: return 'warn' as const;
    }
  }
}
