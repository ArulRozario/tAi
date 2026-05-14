import { Component, input, output, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Page, PageReviewer } from '../../../projects/projects.service';

const IMAGE_STATUSES = new Set(['READY', 'TRANSLATING', 'TRANSLATED', 'REVIEWING', 'HUMAN_REVIEW', 'APPROVED', 'REJECTED', 'RENDER_ERROR', 'TRANSLATION_ERROR']);

@Component({
  selector: 'app-page-thumbnail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-thumbnail.component.html',
  styleUrl: './page-thumbnail.component.scss',
})
export class PageThumbnailComponent {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  page = input.required<Page>();
  projectId = input.required<string>();
  active = input<boolean>(false);
  selected = input<boolean>(false);
  selectionMode = input<boolean>(false);

  select = output<string>();
  assignClick = output<{ pageId: string; event: MouseEvent }>();

  get reviewers(): PageReviewer[] {
    return this.page().reviewers ?? [];
  }

  get visibleReviewers(): PageReviewer[] {
    return this.reviewers.slice(0, 3);
  }

  get extraCount(): number {
    return Math.max(0, this.reviewers.length - 3);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  onAssignClick(event: MouseEvent) {
    event.stopPropagation();
    this.assignClick.emit({ pageId: this.page().id, event });
  }

  imageSrc = signal<SafeUrl | null>(null);
  imageError = signal(false);

  private currentObjectUrl: string | null = null;
  private lastLoadedKey: string | null = null;

  constructor() {
    effect(() => {
      const page = this.page();
      const projectId = this.projectId();

      if (!IMAGE_STATUSES.has(page.status)) {
        this.revokeCurrent();
        this.imageSrc.set(null);
        this.imageError.set(false);
        this.lastLoadedKey = null;
        return;
      }

      // Only re-fetch when the actual image key changes (status entering IMAGE_STATUSES,
      // or page/project identity changing). Status changes within IMAGE_STATUSES don't
      // change the image, so we skip those to avoid re-rendering on every poll.
      const key = `${projectId}/${page.pageNumber}`;
      if (key === this.lastLoadedKey) return;
      this.lastLoadedKey = key;

      const url = `/api/v1/projects/${projectId}/pages/${page.pageNumber}/image`;
      this.http.get(url, { responseType: 'blob' }).subscribe({
        next: (blob) => {
          this.revokeCurrent();
          const objectUrl = URL.createObjectURL(blob);
          this.currentObjectUrl = objectUrl;
          this.imageSrc.set(this.sanitizer.bypassSecurityTrustUrl(objectUrl));
          this.imageError.set(false);
        },
        error: () => {
          this.imageSrc.set(null);
          this.imageError.set(true);
        },
      });
    });
  }

  private revokeCurrent() {
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
  }

  ngOnDestroy() {
    this.revokeCurrent();
  }

  get showImage(): boolean {
    return IMAGE_STATUSES.has(this.page().status);
  }

  get isRendering(): boolean {
    return this.page().status === 'RENDERING';
  }

  get isTranslating(): boolean {
    return this.page().status === 'TRANSLATING';
  }

  get statusClass(): string {
    switch (this.page().status) {
      case 'APPROVED':    return 'status-approved';
      case 'HUMAN_REVIEW':
      case 'REVIEWING':   return 'status-review';
      case 'TRANSLATED':  return 'status-translated';
      case 'TRANSLATING': return 'status-translating';
      case 'READY':       return 'status-ready';
      case 'RENDERING':   return 'status-rendering';
      case 'PENDING':     return 'status-pending';
      case 'REJECTED':
      case 'RENDER_ERROR':
      case 'TRANSLATION_ERROR': return 'status-danger';
      default:            return 'status-pending';
    }
  }

  onClick(): void {
    this.select.emit(this.page().id);
  }
}
