import { Component, signal, computed, ViewChild, ElementRef, AfterViewInit, effect, HostListener, inject, OnInit } from '@angular/core';
import { faro } from '@grafana/faro-web-sdk';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { MessageService, MenuItem } from 'primeng/api';
import { AiChatComponent } from '../shared/components/ai-chat/ai-chat.component';
import { AiChatService } from '../shared/components/ai-chat/ai-chat.service';
import { UnifiedChatService } from '../shared/components/ai-chat/unified-chat.service';
import { PageThumbnailSidebarComponent } from '../shared/components/page-thumbnail-sidebar/page-thumbnail-sidebar.component';
import { ModelPickerComponent } from '../shared/components/model-picker/model-picker.component';
import { CardModule } from 'primeng/card';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as Diff from 'diff';
import { ProjectService, Project, Page } from '../projects/projects.service';
import { mockPages } from './mock-pages';

export interface WorkbenchPage {
  id: string;
  projectId: string;
  chapterNum: number;
  pageNum: number;
  projectName: string;
  styleGuideName?: string;
  status: string;
  assignedTo: string;
  lastAiRun: string;
  metrics: {
    overall: number;
    accuracy: number;
    style: number;
    terms: number;
  };
  aiFeedback: string;
  segments: never[];
  sourceHtml: SafeHtml;
  targetHtml: SafeHtml;
}

@Component({
  selector: 'app-workbench',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    TooltipModule,
    AvatarModule,
    SelectModule,
    AiChatComponent,
    CardModule,
    PageThumbnailSidebarComponent,
    ModelPickerComponent,
  ],
  providers: [
    UnifiedChatService,
    { provide: AiChatService, useExisting: UnifiedChatService },
  ],
  templateUrl: './workbench.component.html',
  styleUrl: './workbench.component.scss',
})
export class WorkbenchComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private sanitizer = inject(DomSanitizer);
  private messageService = inject(MessageService);
  private chatService = inject(AiChatService);
  private unifiedChat = inject(UnifiedChatService);

  @ViewChild('targetScroll') targetScroll!: ElementRef;
  @ViewChild('sourceScroll') sourceScroll!: ElementRef;
  @ViewChild('aiChat') aiChat!: AiChatComponent;

  zoomLevel = signal<number>(100);
  viewMode = signal<'side-by-side' | 'overlay'>('side-by-side');
  sourceViewMode = signal<'html' | 'image'>('html');
  activeSegmentId = signal<string | null>(null);
  editingSegmentId = signal<string | null>(null);
  rightPanelCollapsed = signal<boolean>(true);
  leftPanelCollapsed = signal<boolean>(false);

  activeSegmentTop = signal<number>(0);
  activeSegmentLeft = signal<number>(0);

  private isSyncing = false;
  private isAutoScrolling = false;
  private lastHoveredSegId: string | null = null;
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  edits = signal<{ segmentId: string; editedText: string }[]>([]);
  isSaving = signal(false);
  baseTargetHtml = signal<string>('');
  pageErrors = signal<{ segmentId: string; severity: string; message: string }[]>([]);

  pageData = signal<WorkbenchPage | null>(null);
  loading = signal(true);

  /** URL to the source page image via the dedicated backend endpoint */
  sourceImageUrl = computed(() => {
    const p = this.pageData();
    if (!p) return null;
    return `/api/v1/projects/${p.projectId}/pages/${p.pageNum}/image`;
  });

  /** True when the source image fails to load */
  imageLoadError = signal(false);

  // ─── Navigation & Actions ──────────────────────────────────
  prevPageId = signal<string | null>(null);
  nextPageId = signal<string | null>(null);
  isRetranslating = signal(false);
  isReplacingImage = signal(false);
  isReviewing = signal(false);
  selectedModel = signal<string>('');

  // ─── AI Chat Segment State ────────────────────────────────
  private getActiveSegmentText(): { sourceText: string; currentTranslation: string } | null {
    const segmentId = this.activeSegmentId();
    if (!segmentId) return null;
    const sourceEl = document.querySelector(`.source-col [id="${segmentId}"]`);
    const targetEl = document.querySelector(`.target-col [id="${segmentId}"]`);
    return {
      sourceText: sourceEl?.textContent?.trim() || '',
      currentTranslation: targetEl?.textContent?.trim() || '',
    };
  }

  pageStatusOptions: MenuItem[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Extracted', value: 'EXTRACTED' },
    { label: 'Translated', value: 'TRANSLATED' },
    { label: 'In Review', value: 'REVIEWING' },
    { label: 'Human Review', value: 'HUMAN_REVIEW' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Error', value: 'ERROR' },
  ];

  constructor() {
    effect(() => {
      this.activeSegmentId(); // track
      setTimeout(() => this.updateActiveStyles(), 0);
    });

    this.chatService.contentAccepted$.subscribe((content) => {
      const pageId = this.pageData()?.id;
      const segmentId = this.activeSegmentId();
      if (pageId && segmentId) {
        this.projectService.savePageEdit(pageId, segmentId, content).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Applied', detail: 'AI translation applied.', life: 1500 });
            this.loadEdits(pageId);
          },
          error: (err: any) => {
            const detail = err?.error?.message || 'Failed to apply translation.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail });
          },
        });
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPageData(id);
    }
  }

  loadPageData(pageId: string) {
    this.loading.set(true);
    this.imageLoadError.set(false);
    this.edits.set([]);

    this.projectService.getPage(pageId).subscribe({
      next: (page) => {
        this.projectService.getProject(page.projectId).subscribe({
          next: (project) => {
            const baseSourceHtml = this.ensureSegments(page.originalHtml || '');
            const baseTargetHtml = this.ensureSegments(page.translatedHtml || '');
            this.baseTargetHtml.set(baseTargetHtml);

            this.pageData.set({
              id: page.id,
              projectId: page.projectId,
              chapterNum: 0,
              pageNum: page.pageNumber,
              projectName: project.name,
              styleGuideName: project.styleGuide?.name,
              status: page.status,
              assignedTo: 'You',
              lastAiRun: 'Recently',
              metrics: {
                overall: page.quality || 0,
                accuracy: 0,
                style: 0,
                terms: 0,
              },
              aiFeedback: 'Processing complete. Visual translation generated.',
              segments: [],
              sourceHtml: this.sanitizer.bypassSecurityTrustHtml(baseSourceHtml),
              targetHtml: this.sanitizer.bypassSecurityTrustHtml(baseTargetHtml),
            });

            // Load edits and compile
            this.loadEdits(pageId, baseTargetHtml);

            // Load errors for this page
            this.loadPageErrors(pageId);

            // Set model picker to project's saved model
            this.selectedModel.set(project.translationModel || '');
            this.loading.set(false);
            this.loadSiblings(page.id);
          },
          error: (err) => {
            faro.api?.pushError(new Error('Failed to load project in workbench'), { context: { error: String(err) } });
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        faro.api?.pushError(new Error('Failed to load page in workbench'), { context: { error: String(err) } });
        this.loading.set(false);
      }
    });
  }

  loadEdits(pageId: string, baseHtml?: string) {
    this.projectService.getPageEdits(pageId).subscribe({
      next: (edits) => {
        this.edits.set(edits.map((e) => ({ segmentId: e.segmentId, editedText: e.editedText })));
        const html = baseHtml || this.baseTargetHtml();
        if (html) {
          const compiled = this.compileHtml(html, this.edits());
          this.pageData.update((p) => (p ? { ...p, targetHtml: this.sanitizer.bypassSecurityTrustHtml(compiled) } : p));
        }
      },
      error: (err) => faro.api?.pushError(new Error('Failed to load page edits'), { context: { pageId, error: String(err) } }),
    });
  }

  loadPageErrors(pageId: string) {
    this.projectService.getPageErrors(pageId).subscribe({
      next: (errors) => {
        this.pageErrors.set(errors);
        this.applyErrorStyles();
      },
      error: (err) => faro.api?.pushError(new Error('Failed to load page errors'), { context: { pageId, error: String(err) } }),
    });
  }

  compileHtml(baseHtml: string, edits: { segmentId: string; editedText: string }[]): string {
    if (!edits.length) return baseHtml;
    const parser = new DOMParser();
    const doc = parser.parseFromString(baseHtml, 'text/html');
    for (const edit of edits) {
      const el = doc.getElementById(edit.segmentId);
      if (el) {
        const original = el.textContent || '';
        const diffs = Diff.diffWords(original, edit.editedText);
        let newHtml = '';
        diffs.forEach((part: any) => {
          if (part.added) {
            newHtml += `<ins class="diff-added">${part.value}</ins>`;
          } else if (part.removed) {
            newHtml += `<del class="diff-removed">${part.value}</del>`;
          } else {
            newHtml += `<span>${part.value}</span>`;
          }
        });
        el.innerHTML = newHtml;
      }
    }
    return doc.body.innerHTML;
  }

  /** Load prev/next sibling page IDs for navigation */
  loadSiblings(pageId: string) {
    this.projectService.getPageSiblings(pageId).subscribe({
      next: (siblings) => {
        this.prevPageId.set(siblings.prevPageId);
        this.nextPageId.set(siblings.nextPageId);
      },
      error: (err) => faro.api?.pushError(new Error('Failed to load page siblings'), { context: { pageId, error: String(err) } }),
    });
  }

  /** Navigate to the previous page */
  goToPrevPage() {
    const id = this.prevPageId();
    if (id) {
      this.loadPageData(id);
    }
  }

  /** Navigate to the next page */
  goToNextPage() {
    const id = this.nextPageId();
    if (id) {
      this.loadPageData(id);
    }
  }

  /** Navigate to a page selected from the thumbnail sidebar */
  onSidebarPageSelect(pageId: string) {
    this.loadPageData(pageId);
  }

  /** Trigger file input for image replacement */
  triggerImageReplace(input: HTMLInputElement) {
    input.click();
  }

  /** Handle image file selection and upload */
  onImageReplaceSelected(event: Event, pageId: string) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validate: must be an image
    if (!file.type.startsWith('image/')) {
      this.messageService.add({ severity: 'error', summary: 'Invalid file', detail: 'Please select an image file.' });
      return;
    }

    this.isReplacingImage.set(true);
    this.projectService.replacePageImage(pageId, file).subscribe({
      next: () => {
        this.isReplacingImage.set(false);
        this.messageService.add({ severity: 'success', summary: 'Image replaced', detail: 'Page image updated. You can now retranslate the page.' });
        // Refresh the image by busting cache
        this.imageLoadError.set(false);
        this.pageData.update(p => p ? { ...p } : p);
      },
      error: (err) => {
        this.isReplacingImage.set(false);
        const detail = err?.error?.message || 'Failed to replace image.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });

    input.value = '';
  }

  /** Retranslate the current page using the selected model */
  retranslatePage() {
    const pageId = this.pageData()?.id;
    if (!pageId) return;

    const modelOverride = this.selectedModel() || undefined;
    this.isRetranslating.set(true);
    this.projectService.retranslatePage(pageId, modelOverride).subscribe({
      next: () => {
        this.isRetranslating.set(false);
        this.messageService.add({ severity: 'success', summary: 'Retranslated', detail: 'Page has been retranslated.' });
        this.loadPageData(pageId);
      },
      error: (err) => {
        this.isRetranslating.set(false);
        const detail = err?.error?.message || 'Retranslation failed.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  /** Run AI review on the current page */
  startReview() {
    const pageId = this.pageData()?.id;
    if (!pageId) return;

    this.isReviewing.set(true);
    this.projectService.reviewPage(pageId, this.selectedModel() || undefined).subscribe({
      next: (res: any) => {
        this.isReviewing.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'AI Review complete',
          detail: `Found ${res.errorCount} issues. Quality: ${res.quality}%.`,
        });
        this.loadPageData(pageId);
      },
      error: (err) => {
        this.isReviewing.set(false);
        const detail = err?.error?.message || 'AI review failed.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  /** Change the status of the current page */
  onStatusChange(status: string) {
    const pageId = this.pageData()?.id;
    if (!pageId || !status) return;

    this.projectService.updatePageStatus(pageId, status).subscribe({
      next: (updated) => {
        this.pageData.update(p => p ? { ...p, status: updated.status } : p);
        this.messageService.add({
          severity: 'success',
          summary: 'Status updated',
          detail: `Page status set to ${status.replace(/_/g, ' ')}.`,
        });
      },
      error: (err) => {
        const detail = err?.error?.message || 'Failed to update status.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  /**
   * Temporary helper to wrap lines in segments if they are not already wrapped.
   * In a real extraction, this is done by the backend.
   */
  private ensureSegments(html: string): string {
    if (html.includes('class="segment"')) return html;

    // Simple wrap by line/break for demo if not segmented
    const lines = html.split('<br>');
    return lines.map((line) => `<span id="${this.generateUuid()}" class="segment">${line}</span>`).join('<br>');
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  ngAfterViewInit() {
    // No longer need manual listener attachment
  }

  reviewerNotes = 'Reviewing visual translation consistency...';

  pagesList = [
    { id: '1', num: 1, status: 'in-review' },
  ];

  setZoom(delta: number) {
    this.zoomLevel.update(z => Math.max(50, Math.min(200, z + delta)));
  }

  setActiveSegment(id: string) {
    this.activeSegmentId.set(id);
  }

  toggleRightPanel() {
    this.rightPanelCollapsed.update(v => !v);
  }

  onScroll(event: Event, source: 'source' | 'target') {
    if (this.isSyncing || this.isAutoScrolling) return;

    this.isSyncing = true;
    const scrolledEl = event.target as HTMLElement;
    const targetEl = source === 'source' 
      ? this.targetScroll.nativeElement 
      : this.sourceScroll.nativeElement;

    if (scrolledEl && targetEl) {
      const scrollPercentage = scrolledEl.scrollTop / (scrolledEl.scrollHeight - scrolledEl.clientHeight);
      targetEl.scrollTop = scrollPercentage * (targetEl.scrollHeight - targetEl.clientHeight);
    }
    
    setTimeout(() => this.isSyncing = false, 50);
  }

  onSegmentMouseMove(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const segmentEl = target.closest('.segment');
    const segId = segmentEl?.getAttribute('id');

    if (segId !== this.lastHoveredSegId) {
      document.querySelectorAll('.segment.hovered').forEach(el => {
        el.classList.remove('hovered');
      });

      if (segId) {
        const selector = `[id="${segId}"]`;
        document.querySelectorAll(selector).forEach(el => {
          el.classList.add('hovered');
        });
      }
      this.lastHoveredSegId = segId as string;
    }
  }

  onSegmentMouseLeave() {
    this.lastHoveredSegId = null;
    document.querySelectorAll('.segment.hovered').forEach(el => {
      el.classList.remove('hovered');
    });
  }

  handleSegmentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const segmentEl = target.closest('.segment');
    if (!segmentEl) return;

    const segId = segmentEl.getAttribute('id');
    if (!segId) return;

    this.setActiveSegment(segId);

    this.isAutoScrolling = true;
    const selector = `[id="${segId}"]`;
    document.querySelectorAll(selector).forEach((el) => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    setTimeout(() => (this.isAutoScrolling = false), 800);
  }

  approvedSegmentIds = signal<Set<string>>(new Set());

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      const activeId = this.activeSegmentId();
      if (activeId !== null) {
        event.preventDefault();
        const editingId = this.editingSegmentId();
        if (editingId === activeId) {
          const segmentEl = document.querySelector(`.target-col [id="${editingId}"]`) as HTMLElement;
          if (segmentEl) segmentEl.blur();
        }
        setTimeout(() => this.approveSegment(activeId), 10);
      }
    }
  }

  approveSegment(id: string) {
    this.approvedSegmentIds.update((set) => {
      const next = new Set(set);
      next.add(id);
      return next;
    });
    this.updateActiveStyles();
    this.advanceToNextSegment(id);
  }

  advanceToNextSegment(currentId: string) {
    const targetCol = document.querySelector('.target-col');
    if (!targetCol) return;
    const segments = Array.from(targetCol.querySelectorAll('.segment'));
    const idx = segments.findIndex((el) => el.getAttribute('id') === currentId);
    const nextEl = segments[idx + 1];
    if (nextEl) {
      const nextId = nextEl.getAttribute('id')!;
      this.setActiveSegment(nextId);
      this.isAutoScrolling = true;
      document.querySelectorAll(`[id="${nextId}"]`).forEach((el) => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      setTimeout(() => (this.isAutoScrolling = false), 800);
    }
  }

  triggerEdit(segmentId: string) {
    const segmentEl = document.querySelector(`.target-col [id="${segmentId}"]`) as HTMLElement;
    if (segmentEl) {
      this.editingSegmentId.set(segmentId);
      this.enterEditMode(segmentEl, segmentId);
      this.setActiveSegment(segmentId);
    }
  }

  handleSegmentDoubleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const segmentEl = target.closest('.segment') as HTMLElement;

    if (!segmentEl || !target.closest('.target-col')) return;

    const segId = segmentEl.getAttribute('id');
    if (!segId) return;

    this.editingSegmentId.set(segId);
    this.enterEditMode(segmentEl, segId);
    this.setActiveSegment(segId);

    this.isAutoScrolling = true;
    const selector = `[id="${segId}"]`;
    document.querySelectorAll(selector).forEach((el) => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    setTimeout(() => (this.isAutoScrolling = false), 800);
  }

  private enterEditMode(segmentEl: HTMLElement, segmentId: string) {
    segmentEl.contentEditable = 'true';
    segmentEl.focus();

    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(segmentEl);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);

    const saveEdit = () => {
      const newValue = segmentEl.innerText;
      this.editingSegmentId.set(null);
      segmentEl.contentEditable = 'false';
      segmentEl.onblur = null;
      segmentEl.onkeydown = null;

      // Debounced auto-save to API
      if (this.saveDebounceTimer) {
        clearTimeout(this.saveDebounceTimer);
      }
      this.isSaving.set(true);
      this.saveDebounceTimer = setTimeout(() => {
        const pageId = this.pageData()?.id;
        if (!pageId) return;
        this.projectService.savePageEdit(pageId, segmentId, newValue).subscribe({
          next: () => {
            this.isSaving.set(false);
            this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Edit saved.', life: 1500 });
            // Reload edits and recompile
            const baseHtml = this.pageData()?.targetHtml ? undefined : '';
            this.loadEdits(pageId);
          },
          error: (err) => {
            this.isSaving.set(false);
            const detail = err?.error?.message || 'Failed to save edit.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail });
          },
        });
      }, 500);
    };

    segmentEl.onblur = saveEdit;
    segmentEl.onkeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        segmentEl.blur();
      }
      if (e.key === 'Escape') {
        segmentEl.blur();
      }
    };
  }

  resetSegmentEdit(segmentId: string) {
    const pageId = this.pageData()?.id;
    if (!pageId) return;
    this.projectService.resetPageEdit(pageId, segmentId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Reset', detail: 'Segment edit reset.', life: 1500 });
        this.loadEdits(pageId);
      },
      error: (err) => {
        const detail = err?.error?.message || 'Failed to reset edit.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  resetAllEdits() {
    const pageId = this.pageData()?.id;
    if (!pageId) return;
    this.projectService.resetAllPageEdits(pageId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Reset', detail: 'All edits reset.', life: 1500 });
        this.loadEdits(pageId);
      },
      error: (err) => {
        const detail = err?.error?.message || 'Failed to reset edits.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  /** Open the AI chat panel for segment retranslation */
  openAiRetranslate() {
    const pageId = this.pageData()?.id;
    const segmentId = this.activeSegmentId();
    if (pageId && segmentId) {
      this.unifiedChat.configure({
        context: 'segment',
        entityId: pageId,
        segmentId,
      });
    }

    this.rightPanelCollapsed.set(false);
    const seg = this.getActiveSegmentText();
    const styleGuide = this.pageData()?.styleGuideName;
    if (seg && this.aiChat) {
      const greeting = `Segment retranslation mode${styleGuide ? ` — *${styleGuide}*` : ''}.\n\n**Source:** ${seg.sourceText}\n\n**Current:** ${seg.currentTranslation || '[none]'}\n\nType your instructions (e.g., "make it more formal", "fix grammar") and I'll retranslate this segment.`;
      this.aiChat.reset(greeting);
    }
  }

  private updateActiveStyles() {
    const activeId = this.activeSegmentId();
    const approved = this.approvedSegmentIds();
    const edits = this.edits();
    const editedIds = new Set(edits.map((e) => e.segmentId));
    const errors = this.pageErrors();
    const errorIds = new Set(errors.map((e) => e.segmentId));

    document.querySelectorAll('.segment.active').forEach((el) => {
      el.classList.remove('active');
    });

    document.querySelectorAll('.segment.approved').forEach((el) => {
      el.classList.remove('approved');
    });

    document.querySelectorAll('.segment.edited').forEach((el) => {
      el.classList.remove('edited');
    });

    document.querySelectorAll('.segment.has-error').forEach((el) => {
      el.classList.remove('has-error');
    });

    document.querySelectorAll('.segment .error-badge').forEach((el) => el.remove());

    approved.forEach((id) => {
      document.querySelectorAll(`[id="${id}"]`).forEach((el) => {
        el.classList.add('approved');
      });
    });

    editedIds.forEach((id) => {
      document.querySelectorAll(`[id="${id}"]`).forEach((el) => {
        el.classList.add('edited');
      });
    });

    errorIds.forEach((id) => {
      document.querySelectorAll(`[id="${id}"]`).forEach((el) => {
        el.classList.add('has-error');
        const badge = document.createElement('span');
        badge.className = 'error-badge';
        badge.setAttribute('title', errors.find(e => e.segmentId === id)?.message || 'Error');
        badge.textContent = errors.find(e => e.segmentId === id)?.severity === 'CRITICAL' ? '!' : '?';
        el.appendChild(badge);
      });
    });

    if (activeId === null) return;

    document.querySelectorAll(`[id="${activeId}"]`).forEach((el) => {
      el.classList.add('active');

      const targetCol = el.closest('.target-col');
      if (targetCol) {
        const scrollContent = targetCol.querySelector('.scroll-content');
        if (scrollContent) {
          const elRect = el.getBoundingClientRect();
          const scrollRect = scrollContent.getBoundingClientRect();
          const top = elRect.top - scrollRect.top + scrollContent.scrollTop - 14;
          const left = elRect.right - scrollRect.left + scrollContent.scrollLeft - 14;

          this.activeSegmentTop.set(top);
          this.activeSegmentLeft.set(left);
        }
      }
    });
  }

  private applyErrorStyles() {
    document.querySelectorAll('.segment.has-error').forEach((el) => {
      el.classList.remove('has-error');
    });
    document.querySelectorAll('.segment .error-badge').forEach((el) => el.remove());
    const errors = this.pageErrors();
    errors.forEach(({ segmentId, severity, message }) => {
      document.querySelectorAll(`[id="${segmentId}"]`).forEach((el) => {
        el.classList.add('has-error');
        const badge = document.createElement('span');
        badge.className = 'error-badge';
        badge.setAttribute('title', message);
        badge.textContent = severity === 'CRITICAL' ? '!' : '?';
        el.appendChild(badge);
      });
    });
  }
}
