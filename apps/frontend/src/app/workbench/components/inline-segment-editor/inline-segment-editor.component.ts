import { Component, signal, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ModelPickerComponent } from '../../../shared/components/model-picker/model-picker.component';
import { WorkbenchStateService } from '../../services/workbench-state.service';
import { ProjectService } from '../../../projects/projects.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-inline-segment-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ModelPickerComponent],
  template: `
    <div class="inline-segment-editor">
      <div class="ise-source">
        <span class="ise-label">SOURCE</span>
        <span class="ise-source-text">{{ sourceText() }}</span>
      </div>

      <div class="ise-ai-row">
        <tai-model-picker
          [showDefault]="true"
          (modelChange)="onModelChange($event)">
        </tai-model-picker>
        <input
          pInputText
          [(ngModel)]="aiPromptText"
          placeholder="AI instructions, e.g. 'make it more formal'…"
          class="ise-ai-input"
          (keydown.enter)="sendAiPrompt()">
        <p-button
          icon="pi pi-sparkles"
          size="small"
          severity="info"
          (onClick)="sendAiPrompt()"
          [loading]="state.isAiLoading()"
          pTooltip="Ask AI"
          tooltipPosition="top">
        </p-button>
      </div>

      @if (state.aiSuggestion()) {
        <div class="ise-suggestion">
          <span class="ise-suggestion-text">{{ state.aiSuggestion() }}</span>
          <p-button
            label="Apply"
            size="small"
            severity="success"
            (onClick)="applyAiSuggestion()">
          </p-button>
        </div>
      }

      <div class="ise-actions">
        <p-button
          label="Save"
          icon="pi pi-save"
          size="small"
          severity="primary"
          (onClick)="saveEdit()"
          [loading]="state.isSaving()">
        </p-button>
        <p-button
          label="Reset"
          icon="pi pi-undo"
          size="small"
          severity="secondary"
          [outlined]="true"
          (onClick)="resetEdit()">
        </p-button>
        <p-button
          label="Approve"
          icon="pi pi-check"
          size="small"
          severity="success"
          (onClick)="approve()">
        </p-button>
        <p-button
          icon="pi pi-times"
          [text]="true"
          size="small"
          severity="secondary"
          pTooltip="Close"
          tooltipPosition="top"
          (onClick)="close()">
        </p-button>
      </div>
    </div>
  `,
  styleUrls: ['./inline-segment-editor.component.scss']
})
export class InlineSegmentEditorComponent {
  sourceText = input<string>('');
  
  public state = inject<WorkbenchStateService>(WorkbenchStateService);
  private projectService = inject<ProjectService>(ProjectService);
  private messageService = inject(MessageService);

  aiPromptText = '';
  selectedModel = '';

  onModelChange(model: string) {
    this.selectedModel = model;
  }

  sendAiPrompt() {
    const pageId = this.state.pageData()?.id;
    const segmentId = this.state.activeSegmentId();
    if (!pageId || !segmentId || !this.aiPromptText.trim()) return;

    this.state.isAiLoading.set(true);
    this.projectService.retranslateSegment(
      pageId, segmentId, this.aiPromptText, this.selectedModel || undefined
    ).subscribe({
      next: (res: any) => {
        this.state.isAiLoading.set(false);
        this.state.aiSuggestion.set(res.newTranslation);
      },
      error: (err: any) => {
        this.state.isAiLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'AI retranslation failed.' });
      }
    });
  }

  applyAiSuggestion() {
    const suggestion = this.state.aiSuggestion();
    const segmentId = this.state.activeSegmentId();
    if (!suggestion || !segmentId) return;

    const el = document.querySelector(`.target-col [id="${segmentId}"]`) as HTMLElement;
    if (el) el.innerText = suggestion;
    
    this.state.aiSuggestion.set('');
    this.saveEdit();
  }

  saveEdit() {
    const pageId = this.state.pageData()?.id;
    const segmentId = this.state.activeSegmentId();
    if (!pageId || !segmentId) return;

    const el = document.querySelector(`.target-col [id="${segmentId}"]`) as HTMLElement;
    const newText = el?.innerText?.trim();
    if (!newText) return;

    this.state.isSaving.set(true);
    this.projectService.savePageEdit(pageId, segmentId, newText).subscribe({
      next: () => {
        this.state.isSaving.set(false);
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Edit saved.', life: 1500 });
        this.close();
      },
      error: (err: any) => {
        this.state.isSaving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to save edit.' });
      }
    });
  }

  resetEdit() {
    const pageId = this.state.pageData()?.id;
    const segmentId = this.state.activeSegmentId();
    if (!pageId || !segmentId) return;

    this.projectService.resetPageEdit(pageId, segmentId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Reset', detail: 'Segment edit reset.', life: 1500 });
        this.close();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to reset edit.' });
      }
    });
  }

  approve() {
    const id = this.state.activeSegmentId();
    if (!id) return;
    
    this.state.approvedSegmentIds.update((set: Set<string>) => {
      const next = new Set(set);
      next.add(id);
      return next;
    });
    
    this.saveEdit();
  }

  close() {
    this.state.setEditingSegment(null);
    this.state.setActiveSegment(null);
    this.state.aiSuggestion.set('');
  }
}
