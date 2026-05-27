import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { WorkbenchStateService } from '../../services/workbench-state.service';
import { ReviewSubmission } from '../../services/submissions.service';

@Component({
  selector: 'app-submissions-panel',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, TagModule, TooltipModule],
  template: `
    <div class="submissions-panel">
      <div class="panel-header">
        <h3>
          <i class="pi pi-users"></i>
          Review Submissions
          @if (pendingCount() > 0) {
            <span class="badge">{{ pendingCount() }}</span>
          }
        </h3>
      </div>

      @if (submissions.length === 0) {
        <div class="empty-state">
          <i class="pi pi-inbox"></i>
          <p>No submissions yet</p>
          <span class="hint">Reviewers will submit their corrections here</span>
        </div>
      } @else {
        <div class="submission-list">
          @for (sub of submissions; track sub.id) {
            <div class="submission-card"
                 [class.is-approved]="sub.status === 'APPROVED'"
                 [class.is-rejected]="sub.status === 'REJECTED'"
                 [class.is-active]="activeSubmissionId() === sub.id"
                 [class.is-own]="sub.submittedById === currentUserId">
              <div class="submission-header">
                <div class="reviewer-info">
                  <span class="reviewer-avatar" [style.background]="getAvatarColor(sub.submittedBy.id)">
                    @if (sub.submittedBy.avatarUrl) {
                      <img [src]="sub.submittedBy.avatarUrl" [alt]="sub.submittedBy.name" />
                    } @else {
                      {{ (sub.submittedBy.name || sub.submittedBy.email).charAt(0).toUpperCase() }}
                    }
                  </span>
                  <div class="reviewer-meta">
                    <div class="reviewer-name-row">
                      <span class="reviewer-name">{{ sub.submittedBy.name || sub.submittedBy.email }}</span>
                      @if (sub.submittedById === currentUserId) {
                        <span class="own-badge">You</span>
                      }
                    </div>
                    <span class="submission-time">{{ sub.createdAt | date:'short' }}</span>
                  </div>
                </div>
                <p-tag [value]="sub.status" [severity]="getStatusSeverity(sub.status)" />
              </div>

              @if (sub.notes) {
                <p class="submission-note">{{ sub.notes }}</p>
              }

              <div class="submission-stats">
                <span>
                  <i class="pi pi-pencil"></i>
                  {{ sub.itemCount || (sub.items?.length ?? 0) }} correction{{ (sub.itemCount || (sub.items?.length ?? 0)) !== 1 ? 's' : '' }}
                </span>
              </div>

              <div class="submission-actions">
                @if (sub.status === 'PENDING') {
                  <!-- Preview: secondary outlined -->
                  <button
                    pButton
                    class="p-button-sm p-button-text p-button-secondary"
                    icon="pi pi-eye"
                    label="Preview"
                    (click)="preview.emit(sub.id)"
                    [class.p-button-outlined]="activeSubmissionId() !== sub.id"
                  ></button>
                  <!-- Approve: primary filled -->
                  <button
                    pButton
                    class="p-button-sm p-button-success"
                    icon="pi pi-check"
                    label="Approve"
                    (click)="approve.emit(sub.id)"
                  ></button>
                  <!-- Reject: text danger -->
                  <button
                    pButton
                    class="p-button-sm p-button-text p-button-danger"
                    icon="pi pi-times"
                    label="Reject"
                    (click)="reject.emit(sub.id)"
                  ></button>
                } @else if (sub.status === 'APPROVED') {
                  <span class="approved-badge">
                    <i class="pi pi-check-circle"></i>
                    Approved
                  </span>
                } @else if (sub.status === 'REJECTED') {
                  <span class="rejected-badge">
                    <i class="pi pi-times-circle"></i>
                    Rejected
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./submissions-panel.component.scss'],
})
export class SubmissionsPanelComponent {
  state = inject(WorkbenchStateService);

  @Input({ required: true }) submissions: ReviewSubmission[] = [];
  @Input() currentUserId: string | null = null;
  @Output() preview = new EventEmitter<string>();
  @Output() approve = new EventEmitter<string>();
  @Output() reject = new EventEmitter<string>();

  activeSubmissionId = computed(() => this.state.activeSubmissionId());
  pendingCount = computed(() => this.submissions.filter((s) => s.status === 'PENDING').length);

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
