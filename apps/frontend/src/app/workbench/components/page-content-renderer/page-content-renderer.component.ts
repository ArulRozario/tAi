import {
  Component, Input, Output, EventEmitter, effect, inject,
  ElementRef, ViewChild, OnDestroy, AfterViewInit, Signal, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkbenchStateService } from '../../services/workbench-state.service';
import { SafeHtml } from '@angular/platform-browser';
import { SegmentToolbarComponent } from '../segment-toolbar/segment-toolbar.component';
import { SegmentError } from '../../../core/services/api.service';

@Component({
  selector: 'app-page-content-renderer',
  standalone: true,
  imports: [CommonModule, SegmentToolbarComponent],
  template: `
    <div #container
         class="scroll-content"
         [class.source-mode]="mode === 'source'"
         [class.target-mode]="mode === 'target'"
         (scroll)="onScroll($event)"
         (mousemove)="onMouseMove($event)"
         (click)="onClick($event)">

      @if (mode === 'target' && pageId && state.activeSegmentId()) {
        <app-segment-toolbar
          [pageId]="pageId"
          (contentChanged)="contentChanged.emit()" />
      }

      <div #paper
           class="page-paper"
           [style.min-height.px]="state.maxPageHeight() > 0 ? state.maxPageHeight() : null"
           [innerHTML]="content()"></div>
    </div>
  `,
  styleUrls: ['./page-content-renderer.component.scss'],
})
export class PageContentRendererComponent implements OnDestroy, AfterViewInit {
  @Input({ required: true }) mode!: 'source' | 'target';
  @Input({ required: true }) content!: Signal<SafeHtml | null>;
  @Input() pageId?: string;
  @Output() contentChanged = new EventEmitter<void>();

  @ViewChild('container') container!: ElementRef<HTMLElement>;
  @ViewChild('paper') paper!: ElementRef<HTMLElement>;

  public state = inject<WorkbenchStateService>(WorkbenchStateService);
  private resizeObserver: ResizeObserver | null = null;
  private lastSyncAt = 0;

  constructor() {
    effect(() => {
      const activeId = this.state.activeSegmentId();
      const hoveredId = this.state.hoveredSegmentId();
      const approvedIds = this.state.approvedSegmentIds();
      const errors = this.state.pageErrors();
      const edits = this.state.pageEdits();
      const activeSubmissionId = this.state.activeSubmissionId();
      const submissions = this.state.submissions();
      this.updateDomStyles(activeId, hoveredId, approvedIds, errors, edits, activeSubmissionId, submissions);
    });

    // Apply/remove clean-diff class on the scroll container
    effect(() => {
      const clean = this.state.showCleanDiff();
      const el = this.container?.nativeElement;
      if (!el) return;
      el.classList.toggle('hide-diff', clean);
    });

    // Scroll to the active segment
    effect(() => {
      const activeId = this.state.activeSegmentId();
      if (!activeId) return;
      setTimeout(() => this.scrollToSegment(activeId), 0);
    });

    // Mirror free-scroll from the other column.
    effect(() => {
      const sync = this.state.syncScroll();
      if (!sync || sync.from === this.mode) return;
      const el = this.container?.nativeElement;
      if (!el) return;
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) return;
      this.lastSyncAt = Date.now();
      el.scrollTop = sync.percentage * maxScroll;
    });
  }

  ngAfterViewInit() {
    this.initHeightObserver();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  private initHeightObserver() {
    if (!this.paper) return;
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > this.state.maxPageHeight()) {
          this.state.maxPageHeight.set(height);
        }
      }
    });
    this.resizeObserver.observe(this.paper.nativeElement);
  }

  private scrollToSegment(segId: string) {
    const containerEl = this.container?.nativeElement;
    if (!containerEl) return;
    const el = containerEl.querySelector(`#${CSS.escape(segId)}`) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  onScroll(event: Event) {
    if (Date.now() - this.lastSyncAt < 50) return;
    const el = event.target as HTMLElement;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;
    this.state.syncScroll.set({ from: this.mode, percentage: el.scrollTop / maxScroll });
  }

  onMouseMove(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const segmentEl = target.closest('.segment');
    const segId = segmentEl?.getAttribute('id') ?? null;

    if (segId !== this.state.hoveredSegmentId()) {
      this.state.setHoveredSegment(segId);
    }
  }

  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const segmentEl = target.closest('.segment') as HTMLElement;
    if (!segmentEl) return;

    const segId = segmentEl.getAttribute('id');
    if (!segId) return;

    if (this.mode === 'target') {
      const prev = this.state.activeSegmentId();
      if (prev && prev !== segId) {
        const prevEl = this.container.nativeElement.querySelector(`#${CSS.escape(prev)}`) as HTMLElement | null;
        if (prevEl) prevEl.contentEditable = 'false';
      }
    }

    const sourceEl = document.querySelector(`.source-col [id="${CSS.escape(segId)}"]`);
    this.state.activeSourceText.set(sourceEl?.textContent?.trim() || '');
    this.state.setActiveSegment(segId);
  }

  private updateDomStyles(
    activeId: string | null,
    hoveredId: string | null,
    approvedIds: Set<string>,
    errors: SegmentError[],
    edits: { segmentId: string; editedText: string }[],
    activeSubmissionId: string | null,
    submissions: any[],
  ) {
    const containerEl = this.container?.nativeElement;
    if (!containerEl) return;

    const segments = containerEl.querySelectorAll('.segment');
    segments.forEach((el: Element) => {
      el.classList.remove('active', 'hovered', 'approved', 'has-error', 'has-working-edit', 'has-preview-correction', 'approved-from-submission');
      el.querySelector('.error-badge')?.remove();
      el.querySelector('.edit-badge')?.remove();
      el.querySelector('.correction-badge')?.remove();
    });

    if (hoveredId && hoveredId === activeId) {
      containerEl.querySelector(`#${CSS.escape(hoveredId)}`)?.classList.add('hovered', 'active');
    } else {
      if (hoveredId) {
        containerEl.querySelector(`#${CSS.escape(hoveredId)}`)?.classList.add('hovered');
      }
      if (activeId) {
        containerEl.querySelector(`#${CSS.escape(activeId)}`)?.classList.add('active');
      }
    }

    // Update total segment count once per render (target column only)
    if (this.mode === 'target') {
      this.state.totalSegmentCount.set(segments.length);
    }

    approvedIds.forEach(id => {
      containerEl.querySelector(`#${CSS.escape(id)}`)?.classList.add('approved');
    });

    errors.forEach(err => {
      const el = containerEl.querySelector(`#${CSS.escape(err.segmentId)}`);
      if (el) {
        el.classList.add('has-error');
        const badge = document.createElement('span');
        badge.className = 'error-badge';
        badge.setAttribute('title', err.issueDescription);
        badge.textContent = err.severity === 'CRITICAL' ? '!' : '?';
        el.appendChild(badge);
      }
    });

    // Working edits indicator
    edits.forEach((edit) => {
      const el = containerEl.querySelector(`#${CSS.escape(edit.segmentId)}`);
      if (el) {
        el.classList.add('has-working-edit');
        if (!el.querySelector('.edit-badge')) {
          const badge = document.createElement('span');
          badge.className = 'edit-badge';
          badge.setAttribute('title', 'You have a working edit on this segment');
          badge.textContent = '';
          el.appendChild(badge);
        }
      }
    });

    // Preview submission corrections
    if (activeSubmissionId) {
      const activeSub = submissions.find((s) => s.id === activeSubmissionId);
      activeSub?.items?.forEach((item: any) => {
        const el = containerEl.querySelector(`#${CSS.escape(item.segmentId)}`);
        if (el) {
          el.classList.add('has-preview-correction');
        }
      });
    }

    // Approved submission corrections
    const approvedSub = submissions.find((s) => s.status === 'APPROVED');
    approvedSub?.items?.forEach((item: any) => {
      const el = containerEl.querySelector(`#${CSS.escape(item.segmentId)}`);
      if (el) {
        el.classList.add('approved-from-submission');
      }
    });
  }
}
