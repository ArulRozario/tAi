import { Component, Input, Output, EventEmitter, signal, computed, inject, OnDestroy, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkbenchStateService } from '../../services/workbench-state.service';
import { ProjectService } from '../../../projects/projects.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-segment-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="seg-toolbar" (click)="$event.stopPropagation()">
      @if (!isEditing()) {
        <button class="tool-btn" (click)="openChat()">
          <i class="pi pi-sparkles"></i>
          <span>Ask AI</span>
        </button>
        <div class="tool-sep"></div>
        <button class="tool-btn" (click)="startEdit()">
          <i class="pi pi-pencil"></i>
          <span>Edit</span>
        </button>
        <button class="tool-btn" (click)="resetEdit()"
                [disabled]="!hasEdit()">
          <i class="pi pi-undo"></i>
          <span>Reset</span>
        </button>
        <div class="tool-sep"></div>
        <button class="tool-btn close-btn" (click)="dismiss()">
          <i class="pi pi-times"></i>
        </button>
      } @else {
        <span class="editing-label">
          <i class="pi pi-pencil"></i>
          Editing
        </span>
        <div class="tool-sep"></div>
        <button class="tool-btn save-btn" (click)="saveEdit()"
                [disabled]="isSaving() || !isDirty()">
          <i class="pi pi-check"></i>
          <span>{{ isSaving() ? 'Saving…' : 'Save' }}</span>
        </button>
        <button class="tool-btn" (click)="cancelEdit()">
          <i class="pi pi-times"></i>
          <span>Cancel</span>
        </button>
      }
    </div>
  `,
  styleUrls: ['./segment-toolbar.component.scss'],
})
export class SegmentToolbarComponent implements OnDestroy {
  @Input({ required: true }) pageId!: string;
  @Output() contentChanged = new EventEmitter<void>();

  state = inject(WorkbenchStateService);
  private projectService = inject(ProjectService);
  private messageService = inject(MessageService);

  isEditing = signal(false);
  isSaving = signal(false);
  isDirty = signal(false);

  hasEdit = computed(() => {
    const segId = this.state.activeSegmentId();
    return !!segId && this.state.pageEdits().some(e => e.segmentId === segId);
  });

  private editTarget: HTMLElement | null = null;
  private originalText = '';
  private inputListener: (() => void) | null = null;

  constructor() {
    // When the active segment changes, discard any in-progress edit and reset state.
    effect(() => {
      this.state.activeSegmentId(); // subscribe to changes
      untracked(() => this.resetState());
    });
  }

  private resetState() {
    if (this.editTarget) {
      this.editTarget.innerText = this.originalText;
      this.editTarget.contentEditable = 'false';
      this.editTarget = null;
    }
    this.originalText = '';
    this.isEditing.set(false);
    this.isSaving.set(false);
  }

  openChat() {
    this.state.rightPanelCollapsed.set(false);
  }

  startEdit() {
    const segId = this.state.activeSegmentId();
    if (!segId) return;
    const el = document.querySelector(`.target-col #${CSS.escape(segId)}`) as HTMLElement | null;
    if (!el) return;

    this.editTarget = el;
    this.originalText = el.innerText;
    el.contentEditable = 'true';
    el.focus();

    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    this.isEditing.set(true);
  }

  cancelEdit() {
    if (this.editTarget) {
      this.editTarget.innerText = this.originalText;
      this.editTarget.contentEditable = 'false';
      this.editTarget = null;
    }
    this.isEditing.set(false);
  }

  saveEdit() {
    const segId = this.state.activeSegmentId();
    if (!segId || !this.editTarget) return;

    const newText = this.editTarget.innerText.trim();
    if (!newText) return;

    this.isSaving.set(true);
    this.projectService.savePageEdit(this.pageId, segId, newText).subscribe({
      next: () => {
        this.editTarget!.contentEditable = 'false';
        this.editTarget = null;
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Edit saved.', life: 1500 });
        this.contentChanged.emit();
        this.state.setActiveSegment(null);
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to save edit.',
        });
      },
    });
  }

  resetEdit() {
    const segId = this.state.activeSegmentId();
    if (!segId) return;

    this.projectService.resetPageEdit(this.pageId, segId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Reset', detail: 'Corrections reset.', life: 1500 });
        this.contentChanged.emit();
        this.dismiss();
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Failed to reset.',
        });
      },
    });
  }

  dismiss() {
    if (this.editTarget) {
      this.editTarget.contentEditable = 'false';
      this.editTarget = null;
    }
    this.isEditing.set(false);
    this.state.setActiveSegment(null);
  }

  ngOnDestroy() {
    this.resetState();
  }
}
