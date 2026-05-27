import { Component, input, output, inject, ViewChild, computed, signal, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { PopoverModule } from 'primeng/popover';
import { Popover } from 'primeng/popover';
import { WorkbenchStateService, WorkbenchPage } from '../../services/workbench-state.service';
import { ModelPickerComponent } from '../../../shared/components/model-picker/model-picker.component';
import { User } from '../../../core/services/api.service';
import { ReviewSubmission } from '../../services/submissions.service';

@Component({
  selector: 'app-workbench-toolbar',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, SelectModule, AvatarModule, MenuModule, TooltipModule,
    PopoverModule,
    ModelPickerComponent,
  ],
  templateUrl: './workbench-toolbar.component.html',
  styleUrl: './workbench-toolbar.component.scss',
})
export class WorkbenchToolbarComponent {
  state = inject(WorkbenchStateService);

  // ── Inputs ──────────────────────────────────────────────────
  pageData               = input.required<WorkbenchPage>();
  isRetranslating        = input(false);
  isApproving            = input(false);
  isRevoking             = input(false);
  isSubmittingReview     = input(false);
  isMasterOrAdmin        = input(false);
  pageStatusOptions      = input<{ label: string; value: string }[]>([]);
  allUsers               = input<User[]>([]);
  submissions            = input<ReviewSubmission[]>([]);
  hasWorkingEdits        = input(false);
  mySubmission           = input<ReviewSubmission | undefined>(undefined);
  pendingSubmissionCount = input(0);

  // ── Outputs ─────────────────────────────────────────────────
  prevPage             = output();
  nextPage             = output();
  goBack               = output();
  retranslate          = output();
  modelChange          = output<string>();
  resetEdits           = output();
  statusChange         = output<string>();
  addReviewer          = output<string>();
  removeReviewer       = output<string>();
  approve              = output();
  revoke               = output();
  submitForReview      = output();
  unsubmitReview       = output<string>();
  openSubmissionsPanel = output();
  openChatPanel        = output();

  @ViewChild('reviewerPanel') reviewerPanel!: Popover;

  selectedUser: User | null = null;
  selectedStatus = signal<string>('');
  confirmingReset = signal(false);

  constructor() {
    effect(() => {
      const status = this.pageData().status;
      untracked(() => this.selectedStatus.set(status));
    });
  }

  availableUsers = computed(() => {
    const assignedIds = new Set(this.pageData().reviewers.map(r => r.userId));
    return this.allUsers().filter(u => !assignedIds.has(u.id));
  });

  private readonly AVATAR_COLORS = [
    '#6366f1','#ec4899','#f59e0b','#10b981',
    '#3b82f6','#8b5cf6','#ef4444','#14b8a6',
  ];

  getAvatarColor(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.AVATAR_COLORS[Math.abs(hash) % this.AVATAR_COLORS.length];
  }

  getInitial(reviewer: WorkbenchPage['reviewers'][0]): string {
    return (reviewer.user?.name || reviewer.user?.email || '?').charAt(0).toUpperCase();
  }

  getDisplayName(reviewer: WorkbenchPage['reviewers'][0]): string {
    return reviewer.user?.name || reviewer.user?.email || 'Unknown';
  }

  openReviewerPanel(event: Event) {
    this.selectedUser = null;
    this.reviewerPanel.toggle(event);
  }

  onUserSelected(user: User) {
    if (!user) return;
    this.addReviewer.emit(user.id);
    this.selectedUser = null;
  }

  onRemoveReviewer(userId: string) {
    this.removeReviewer.emit(userId);
  }

  requestReset() {
    this.confirmingReset.set(true);
  }

  cancelReset() {
    this.confirmingReset.set(false);
  }

  doReset() {
    this.confirmingReset.set(false);
    this.resetEdits.emit();
  }
}
