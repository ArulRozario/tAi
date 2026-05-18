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
      <div #paper
           class="page-paper"
           [style.min-height.px]="state.maxPageHeight() > 0 ? state.maxPageHeight() : null"
           [innerHTML]="content()"></div>

      @if (mode === 'target' && pageId && toolbarTop() !== null) {
        <app-segment-toolbar
          [pageId]="pageId"
          [style.top.px]="toolbarTop()"
          (contentChanged)="contentChanged.emit()" />
      }
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

  toolbarTop = signal<number | null>(null);

  constructor() {
    effect(() => {
      const activeId = this.state.activeSegmentId();
      const hoveredId = this.state.hoveredSegmentId();
      const approvedIds = this.state.approvedSegmentIds();
      const errors = this.state.pageErrors();
      this.updateDomStyles(activeId, hoveredId, approvedIds, errors);
    });

    // Scroll to the active segment and position the toolbar above it.
    effect(() => {
      const activeId = this.state.activeSegmentId();

      if (!activeId) {
        this.toolbarTop.set(null);
        return;
      }

      setTimeout(() => {
        this.scrollToSegment(activeId);
        if (this.mode === 'target') {
          this.positionToolbar(activeId);
        }
      }, 0);
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

  // Position the toolbar just above the active segment using content-relative coordinates.
  private positionToolbar(segId: string) {
    const containerEl = this.container?.nativeElement;
    if (!containerEl) return;
    const segEl = containerEl.querySelector(`#${CSS.escape(segId)}`) as HTMLElement | null;
    if (!segEl) {
      this.toolbarTop.set(null);
      return;
    }

    const containerRect = containerEl.getBoundingClientRect();
    const segRect = segEl.getBoundingClientRect();
    // Convert viewport-relative position to scroll-content-relative.
    const contentTop = segRect.top - containerRect.top + containerEl.scrollTop;

    const TOOLBAR_HEIGHT = 32;
    const GAP = 4;
    this.toolbarTop.set(Math.max(0, contentTop - TOOLBAR_HEIGHT - GAP));
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
  ) {
    const containerEl = this.container?.nativeElement;
    if (!containerEl) return;

    const segments = containerEl.querySelectorAll('.segment');
    segments.forEach((el: Element) => {
      el.classList.remove('active', 'hovered', 'approved', 'has-error');
      el.querySelector('.error-badge')?.remove();
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
  }
}
