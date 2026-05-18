import { Component, signal, computed, ViewChild, ElementRef, AfterViewInit, effect, untracked, inject, OnInit } from '@angular/core';
import { faro } from '@grafana/faro-web-sdk';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { switchMap, map } from 'rxjs/operators';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { MenuModule } from 'primeng/menu';
import { MessageService, MenuItem } from 'primeng/api';
import { AiChatComponent } from '../shared/components/ai-chat/ai-chat.component';
import { AiChatService } from '../shared/components/ai-chat/ai-chat.service';
import { UnifiedChatService } from '../shared/components/ai-chat/unified-chat.service';
import { PageThumbnailSidebarComponent } from '../shared/components/page-thumbnail-sidebar/page-thumbnail-sidebar.component';
import { ModelPickerComponent } from '../shared/components/model-picker/model-picker.component';
import { CardModule } from 'primeng/card';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as Diff from 'diff';
import { ProjectService, Project, Page, PageReviewer } from '../projects/projects.service';
import { ApiService, User, SegmentError } from '../core/services/api.service';
import { AuthService } from '../auth/auth.service';
import { WorkbenchStateService, WorkbenchPage } from './services/workbench-state.service';
import { PageContentRendererComponent } from './components/page-content-renderer/page-content-renderer.component';
import { WorkbenchToolbarComponent } from './components/workbench-toolbar/workbench-toolbar.component';

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
    AvatarGroupModule,
    SelectModule,
    MultiSelectModule,
    InputTextModule,
    TextareaModule,
    DialogModule,
    MenuModule,
    AiChatComponent,
    CardModule,
    PageThumbnailSidebarComponent,
    PageContentRendererComponent,
    WorkbenchToolbarComponent,
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
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private messageService = inject(MessageService);
  private chatService = inject(AiChatService);
  private unifiedChat = inject(UnifiedChatService);
  public state = inject(WorkbenchStateService);

  @ViewChild('aiChat') aiChat!: AiChatComponent;

  edits = signal<{ segmentId: string; editedText: string }[]>([]);
  baseTargetHtml = signal<string>('');
  pageErrors = signal<{ segmentId: string; severity: string; message: string }[]>([]);

  // ─── Page Data (Managed in component as it's local to the page load) ───
  pageData = signal<WorkbenchPage | null>(null);
  loading = signal(true);

  sourceHtml = computed(() => this.pageData()?.sourceHtml ?? null);
  targetHtml = computed(() => this.pageData()?.targetHtml ?? null);

  sourceImageUrl = computed(() => {
    const p = this.pageData();
    if (!p) return null;
    return this.projectService.withToken(`/api/v1/projects/${p.projectId}/pages/${p.pageNum}/image`);
  });

  imageLoadError = signal(false);
  isRetranslating = signal(false);
  isReplacingImage = signal(false);
  isReviewing = signal(false);
  isCompleting = signal(false);
  selectedModel = signal<string>('');

  isQueueMode = signal(false);
  isMasterOrAdmin = computed(() => this.authService.hasAnyRole(['MASTER', 'ADMIN']));

  userInitials = computed(() => {
    const name = this.authService.getCurrentUser()?.name ?? '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  });

  errorPanelCollapsed = false;

  overflowMenuItems: MenuItem[] = [
    {
      label: 'Request changes',
      icon: 'pi pi-undo',
      command: () => { this.showRequestChangesDialog = true; },
    },
    {
      label: 'Escalate',
      icon: 'pi pi-exclamation-triangle',
      command: () => { this.showEscalateDialog = true; },
    },
  ];

  showRequestChangesDialog = false;
  showEscalateDialog = false;
  showAddReviewerDialog = false;
  showReassignDialog = false;
  requestChangesNote = '';
  escalateReason = '';

  allUsers = signal<User[]>([]);
  selectedNewReviewerUserId = '';
  selectedReassignUserIds: string[] = [];

  pageStatusOptions: MenuItem[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Extracted', value: 'EXTRACTED' },
    { label: 'Translated', value: 'TRANSLATED' },
    { label: 'In Review', value: 'REVIEWING' },
    { label: 'Human Review', value: 'HUMAN_REVIEW' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Render Error', value: 'RENDER_ERROR' },
    { label: 'Translation Error', value: 'TRANSLATION_ERROR' },
  ];

  constructor() {
    this.chatService.contentAccepted$.subscribe((content) => {
      const pageId = this.pageData()?.id;
      const segmentId = this.state.activeSegmentId();
      if (pageId && segmentId) {
        this.projectService.savePageEdit(pageId, segmentId, content).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Applied', detail: 'AI translation applied.', life: 1500 });
            this.state.setActiveSegment(null);
            this.loadEdits(pageId);
          },
          error: (err: any) => {
            const detail = err?.error?.message || 'Failed to apply translation.';
            this.messageService.add({ severity: 'error', summary: 'Error', detail });
          },
        });
      }
    });

    effect(() => {
      const segId = this.state.activeSegmentId();
      const sourceText = this.state.activeSourceText();
      if (!segId) return;

      const pageId = untracked(() => this.pageData()?.id);

      const translationEl = document.querySelector(`.target-col [id="${CSS.escape(segId)}"]`);
      const translationText = translationEl?.textContent?.trim() || '';

      this.unifiedChat.configure({
        context: 'workbench',
        entityId: pageId,
        segmentId: segId,
        currentContent: translationText,
      });

      const greeting = [
        '**Segment selected**',
        '',
        `**Source:** ${sourceText || '—'}`,
        '',
        `**Current translation:** ${translationText || '—'}`,
        '',
        'How would you like to refine this translation?',
      ].join('\n');

      this.aiChat?.reset(greeting);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.isQueueMode.set(this.route.snapshot.data['mode'] === 'queue');
    const id = this.route.snapshot.paramMap.get('pageId');
    if (id) {
      this.loadPageData(id);
    }
  }

  loadPageData(pageId: string) {
    this.loading.set(true);
    this.imageLoadError.set(false);
    this.edits.set([]);

    this.projectService.getPage(pageId).pipe(
      switchMap((page) =>
        this.projectService.getProject(page.projectId).pipe(
          map((project) => ({ page, project }))
        )
      )
    ).subscribe({
      next: ({ page, project }) => {
        const baseSourceHtml = page.originalHtml || '';
        const baseTargetHtml = page.translatedHtml || '';
        this.baseTargetHtml.set(baseTargetHtml);

        this.pageData.set({
          id: page.id,
          projectId: page.projectId,
          pageNum: page.pageNumber,
          projectName: project.name,
          styleGuideName: project.styleGuide?.name,
          status: page.status,
          submittedAt: (page as any).submittedAt ?? null,
          sourceLang: project.sourceLang,
          targetLang: project.targetLang,
          reviewers: page.reviewers || [],
          sourceHtml: this.sanitizer.bypassSecurityTrustHtml(baseSourceHtml),
          targetHtml: this.sanitizer.bypassSecurityTrustHtml(baseTargetHtml),
        });

        this.loadEdits(pageId, baseTargetHtml);
        this.loadPageErrors(pageId);
        this.loadSegmentApprovals(pageId);
        this.selectedModel.set(project.translationModel || '');
        this.loading.set(false);
        this.loadSiblings(page.id);
      },
      error: (err) => {
        faro.api?.pushError(new Error('Failed to load page in workbench'), { context: { error: String(err) } });
        this.loading.set(false);
      },
    });
  }

  loadEdits(pageId: string, baseHtml?: string) {
    this.projectService.getPageEdits(pageId).subscribe({
      next: (edits) => {
        const mapped = edits.map((e) => ({ segmentId: e.segmentId, editedText: e.editedText }));
        this.edits.set(mapped);
        this.state.pageEdits.set(mapped);
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
    this.apiService.getPageErrors(pageId).subscribe({
      next: (errors) => {
        this.state.pageErrors.set(errors);
        this.errorPanelCollapsed = false;
      },
      error: (err) => faro.api?.pushError(new Error('Failed to load page errors'), { context: { pageId, error: String(err) } }),
    });
  }

  loadSegmentApprovals(pageId: string) {
    this.apiService.getPage(pageId).subscribe({
      next: (detail) => {
        this.state.totalSegmentCount.set(detail.segments?.length ?? 0);
        const approvedIds = new Set<string>(
          (detail.segments ?? []).filter(s => s.isApproved).map(s => s.id)
        );
        this.state.approvedSegmentIds.set(approvedIds);
      },
      error: () => {},
    });
  }

  applyError(err: SegmentError) {
    this.apiService.applyError(err.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Fix applied', life: 1500 });
        const pageId = this.pageData()?.id;
        if (pageId) {
          this.loadPageErrors(pageId);
          this.loadEdits(pageId);
        }
      },
      error: (e: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed to apply fix.' });
      },
    });
  }

  private readonly INLINE_DIFF_THRESHOLD = 3;

  compileHtml(baseHtml: string, edits: { segmentId: string; editedText: string }[]): string {
    if (!edits.length) return baseHtml;
    const parser = new DOMParser();
    const doc = parser.parseFromString(baseHtml, 'text/html');
    for (const edit of edits) {
      const el = doc.getElementById(edit.segmentId);
      if (el) {
        const original = el.textContent || '';
        const diffs = Diff.diffWords(original, edit.editedText);
        const changedCount = diffs.filter((p: any) => p.added || p.removed).length;

        if (changedCount > this.INLINE_DIFF_THRESHOLD) {
          el.innerHTML = `<span class="diff-stacked"><span class="diff-stacked-original">${original}</span><span class="diff-stacked-edited">${edit.editedText}</span></span>`;
        } else {
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
    }
    return doc.body.innerHTML;
  }

  loadSiblings(pageId: string) {
    this.projectService.getPageSiblings(pageId).subscribe({
      next: (siblings) => {
        this.state.prevPageId.set(siblings.prevPageId);
        this.state.nextPageId.set(siblings.nextPageId);
      },
      error: (err) => faro.api?.pushError(new Error('Failed to load page siblings'), { context: { pageId, error: String(err) } }),
    });
  }

  goToPrevPage() {
    const id = this.state.prevPageId();
    if (id) {
      this.loadPageData(id);
    }
  }

  goToNextPage() {
    const id = this.state.nextPageId();
    if (id) {
      this.loadPageData(id);
    }
  }

  onSidebarPageSelect(pageId: string) {
    this.loadPageData(pageId);
  }

  triggerImageReplace(input: HTMLInputElement) {
    input.click();
  }

  onImageReplaceSelected(event: Event, pageId: string) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.messageService.add({ severity: 'error', summary: 'Invalid file', detail: 'Please select an image file.' });
      return;
    }

    this.isReplacingImage.set(true);
    this.projectService.replacePageImage(pageId, file).subscribe({
      next: () => {
        this.isReplacingImage.set(false);
        this.messageService.add({ severity: 'success', summary: 'Image replaced', detail: 'Page image updated. You can now retranslate the page.' });
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

  resetAllEdits() {
    const pageId = this.pageData()?.id;
    if (!pageId) return;
    this.projectService.resetAllPageEdits(pageId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Reset', detail: 'All edits reset.', life: 1500 });
        this.loadEdits(pageId);
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to reset all edits.' });
      },
    });
  }

  ngAfterViewInit() {}

  toggleRightPanel() {
    this.state.rightPanelCollapsed.update(v => !v);
  }

  goBack() {
    if (this.isQueueMode()) {
      this.router.navigate(['/queue']);
    } else {
      const projectId = this.pageData()?.projectId;
      if (projectId) {
        this.router.navigate(['/projects', projectId]);
      }
    }
  }

  skipPage() {
    const pageId = this.pageData()?.id;
    if (!pageId) return;
    this.apiService.getNextInQueue(pageId).subscribe({
      next: (res) => {
        if (res.nextPageId) {
          this.router.navigate(['/review', res.nextPageId]);
          this.loadPageData(res.nextPageId);
          this.isQueueMode.set(true);
        } else {
          this.messageService.add({ severity: 'info', summary: 'Queue empty', detail: 'No more pages in the review queue.' });
          this.router.navigate(['/queue']);
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to get next page.' });
      },
    });
  }

  completePage() {
    const pageId = this.pageData()?.id;
    if (!pageId) return;
    this.isCompleting.set(true);
    this.apiService.approvePage(pageId).subscribe({
      next: () => {
        this.isCompleting.set(false);
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Page approved.' });
        this.skipPage();
      },
      error: () => {
        this.isCompleting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to approve page.' });
      },
    });
  }

  submitForReview() {
    const pageId = this.pageData()?.id;
    if (!pageId) return;
    this.isCompleting.set(true);
    this.apiService.submitPageForReview(pageId).subscribe({
      next: (page) => {
        this.isCompleting.set(false);
        this.pageData.update(p => p ? { ...p, submittedAt: (page as any).submittedAt } : p);
        this.messageService.add({ severity: 'success', summary: 'Submitted', detail: 'Page submitted for master review.' });
      },
      error: () => {
        this.isCompleting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit page.' });
      },
    });
  }

  submitRequestChanges() {
    const pageId = this.pageData()?.id;
    if (!pageId || !this.requestChangesNote.trim()) return;
    this.apiService.requestChanges(pageId, this.requestChangesNote).subscribe({
      next: () => {
        this.showRequestChangesDialog = false;
        this.requestChangesNote = '';
        this.messageService.add({ severity: 'success', summary: 'Changes requested', detail: 'Page returned for retranslation.' });
        this.skipPage();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to request changes.' });
      },
    });
  }

  submitEscalate() {
    const pageId = this.pageData()?.id;
    if (!pageId || !this.escalateReason.trim()) return;
    this.apiService.escalatePage(pageId, this.escalateReason).subscribe({
      next: () => {
        this.showEscalateDialog = false;
        this.escalateReason = '';
        this.messageService.add({ severity: 'success', summary: 'Escalated', detail: 'Page has been escalated.' });
        this.skipPage();
      },
      error: (err) => {
        this.showEscalateDialog = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to escalate page.' });
      },
    });
  }

  openAddReviewer() {
    if (!this.allUsers().length) {
      this.apiService.getUsers().subscribe({
        next: (users) => this.allUsers.set(users),
        error: () => {},
      });
    }
    this.selectedNewReviewerUserId = '';
    this.showAddReviewerDialog = true;
  }

  submitAddReviewer() {
    const pageId = this.pageData()?.id;
    if (!pageId || !this.selectedNewReviewerUserId) return;
    this.apiService.addReviewer(pageId, this.selectedNewReviewerUserId).subscribe({
      next: (page) => {
        this.showAddReviewerDialog = false;
        this.pageData.update(p => p ? { ...p, reviewers: (page as any).reviewers || p.reviewers } : p);
        this.messageService.add({ severity: 'success', summary: 'Reviewer added', life: 1500 });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add reviewer.' });
      },
    });
  }

  openReassign() {
    if (!this.allUsers().length) {
      this.apiService.getUsers().subscribe({
        next: (users) => this.allUsers.set(users),
        error: () => {},
      });
    }
    this.selectedReassignUserIds = this.pageData()?.reviewers?.map(r => r.userId) || [];
    this.showReassignDialog = true;
  }

  submitReassign() {
    const pageId = this.pageData()?.id;
    if (!pageId || !this.selectedReassignUserIds.length) return;
    this.apiService.reassignReviewers(pageId, this.selectedReassignUserIds).subscribe({
      next: (page) => {
        this.showReassignDialog = false;
        this.pageData.update(p => p ? { ...p, reviewers: (page as any).reviewers || p.reviewers } : p);
        this.messageService.add({ severity: 'success', summary: 'Reviewers updated', life: 1500 });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to reassign reviewers.' });
      },
    });
  }
}
