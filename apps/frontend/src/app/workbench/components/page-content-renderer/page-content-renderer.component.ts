import { Component, Input, effect, inject, ElementRef, ViewChild, OnDestroy, AfterViewInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkbenchStateService } from '../../services/workbench-state.service';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-page-content-renderer',
  standalone: true,
  imports: [CommonModule],
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
    </div>
  `,
  styleUrls: ['./page-content-renderer.component.scss']
})
export class PageContentRendererComponent implements OnDestroy, AfterViewInit {
  @Input({ required: true }) mode!: 'source' | 'target';
  @Input({ required: true }) content!: Signal<SafeHtml | null>;

  @ViewChild('container') container!: ElementRef<HTMLElement>;
  @ViewChild('paper') paper!: ElementRef<HTMLElement>;

  public state = inject<WorkbenchStateService>(WorkbenchStateService);
  private isAutoScrolling = false;
  private lastScrollTime = 0;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    effect(() => {
      const activeId = this.state.activeSegmentId();
      const hoveredId = this.state.hoveredSegmentId();
      const approvedIds = this.state.approvedSegmentIds();
      const errors = this.state.pageErrors();
      this.updateDomStyles(activeId, hoveredId, approvedIds, errors);
    });

    effect(() => {
      const sync = this.state.scrollPercentage();
      if (sync && sync.source !== this.mode) {
        this.syncScroll(sync.percentage);
      }
    });
  }

  ngAfterViewInit() {
    this.initHeightObserver();
    this.initGlobalScrollListener();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    window.removeEventListener('workbench-sync-scroll', this.handleGlobalScroll);
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

  private initGlobalScrollListener() {
    window.addEventListener('workbench-sync-scroll', this.handleGlobalScroll);
  }

  private handleGlobalScroll = (event: Event) => {
    const e = event as CustomEvent<{ source: string; scrollPercentage: number }>;
    if (e.detail.source === this.mode) return;
    this.syncScroll(e.detail.scrollPercentage);
  };

  private syncScroll(percentage: number) {
    if (!this.container?.nativeElement) return;

    const el = this.container.nativeElement;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;

    const targetTop = percentage * maxScroll;
    const currentTop = el.scrollTop;

    if (Math.abs(currentTop - targetTop) < 2) return;

    this.isAutoScrolling = true;
    el.scrollTo({ top: targetTop, behavior: 'smooth' });

    setTimeout(() => {
      this.isAutoScrolling = false;
    }, 150);
  }

  onScroll(event: Event) {
    if (this.isAutoScrolling) return;

    const now = Date.now();
    if (now - this.lastScrollTime < 16) return;
    this.lastScrollTime = now;

    const scrolledEl = event.target as HTMLElement;
    const maxScroll = scrolledEl.scrollHeight - scrolledEl.clientHeight;
    if (maxScroll <= 0) return;

    const scrollPercentage = scrolledEl.scrollTop / maxScroll;

    window.dispatchEvent(new CustomEvent('workbench-sync-scroll', {
      detail: { source: this.mode, scrollPercentage }
    }));
  }

  onMouseMove(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const segmentEl = target.closest('.segment');
    const segId = segmentEl?.getAttribute('id');

    if (segId !== this.state.hoveredSegmentId()) {
      this.state.setHoveredSegment(segId ?? null);
    }
  }

  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const segmentEl = target.closest('.segment') as HTMLElement;
    if (!segmentEl) return;

    const segId = segmentEl.getAttribute('id');
    if (!segId) return;

    if (this.mode === 'target') {
      this.state.setActiveSegment(segId);
      this.state.setEditingSegment(segId);
      this.enterEditMode(segmentEl);

      this.positionEditor(segmentEl);

      const sourceEl = document.querySelector(`.source-col [id="${CSS.escape(segId)}"]`);
      this.state.activeSourceText.set(sourceEl?.textContent?.trim() || '');
    } else {
      const targetEl = document.querySelector(`.target-col [id="${CSS.escape(segId)}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  private positionEditor(segmentEl: HTMLElement) {
    const containerEl = this.container?.nativeElement;
    if (!containerEl) return;

    segmentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    requestAnimationFrame(() => {
      const containerTop = containerEl.getBoundingClientRect().top + containerEl.scrollTop;
      const segmentTop = segmentEl.getBoundingClientRect().top + containerEl.scrollTop;
      const segmentHeight = segmentEl.offsetHeight;
      const containerHeight = containerEl.clientHeight;

      let editorTop: number;
      const editorHeight = 200;
      const spaceBelow = containerTop + containerHeight - (segmentTop + segmentHeight);
      const spaceAbove = segmentTop - containerTop;

      if (spaceBelow >= editorHeight + 20) {
        editorTop = segmentTop + segmentHeight + 8;
      } else if (spaceAbove >= editorHeight + 20) {
        editorTop = segmentTop - editorHeight - 8;
      } else {
        editorTop = segmentTop + segmentHeight + 8;
      }

      editorTop = Math.max(containerEl.scrollTop, Math.min(editorTop, containerEl.scrollTop + containerHeight - editorHeight));
      this.state.editorTop.set(editorTop - containerTop);
    });
  }

  private enterEditMode(segmentEl: HTMLElement) {
    segmentEl.contentEditable = 'true';
    segmentEl.focus();

    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(segmentEl);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  private updateDomStyles(activeId: string | null, hoveredId: string | null, approvedIds: Set<string>, errors: any[]) {
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
        badge.setAttribute('title', err.message);
        badge.textContent = err.severity === 'CRITICAL' ? '!' : '?';
        el.appendChild(badge);
      }
    });
  }
}