import { Component, signal, computed, ViewChild, effect, untracked, inject, OnInit, DestroyRef, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { faro } from '@grafana/faro-web-sdk';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { switchMap, map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { AiChatComponent } from '../shared/components/ai-chat/ai-chat.component';
import { AiChatService } from '../shared/components/ai-chat/ai-chat.service';
import { UnifiedChatService } from '../shared/components/ai-chat/unified-chat.service';
import { PageThumbnailSidebarComponent } from '../shared/components/page-thumbnail-sidebar/page-thumbnail-sidebar.component';
import { CardModule } from 'primeng/card';
import { DomSanitizer } from '@angular/platform-browser';
import * as Diff from 'diff';
import { ProjectService } from '../projects/projects.service';
import { ApiService, User, SegmentError } from '../core/services/api.service';
import { AuthService } from '../auth/auth.service';
import { WorkbenchStateService, WorkbenchPage } from './services/workbench-state.service';
import { SubmissionsService, SegmentReviewCorrection } from './services/submissions.service';
import { PageContentRendererComponent } from './components/page-content-renderer/page-content-renderer.component';
import { WorkbenchToolbarComponent } from './components/workbench-toolbar/workbench-toolbar.component';
import { SubmissionsPanelComponent } from './components/submissions-panel/submissions-panel.component';
import { SegmentReviewsComponent } from './components/segment-reviews/segment-reviews.component';

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
    MultiSelectModule,
    InputTextModule,
    TextareaModule,
    DialogModule,
    AiChatComponent,
    CardModule,
    PageThumbnailSidebarComponent,
    PageContentRendererComponent,
    WorkbenchToolbarComponent,
    SubmissionsPanelComponent,
    SegmentReviewsComponent,
  ],
  providers: [
    UnifiedChatService,
    { provide: AiChatService, useExisting: UnifiedChatService },
  ],
  templateUrl: './workbench.component.html',
  styleUrl: './workbench.component.scss',
})
export class WorkbenchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private apiService = inject(ApiService);
  authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private messageService = inject(MessageService);
  private chatService = inject(AiChatService);
  private unifiedChat = inject(UnifiedChatService);
  public state = inject(WorkbenchStateService);
  private submissionsService = inject(SubmissionsService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('aiChat') aiChat!: AiChatComponent;

  edits = signal<{ segmentId: string; editedText: string }[]>([]);
  baseTargetHtml = signal<string>('');
  pageErrors = signal<{ segmentId: string; severity: string; message: string }[]>([]);

  private loadingPageId = '';
  private currentPageId = signal<string | null>(null);

  // ─── Page Data ───
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

  isApproving = signal(false);
  isRevoking = signal(false);
  isSubmittingPage = signal(false);
  isSubmittingReview = signal(false);
  isUnsubmitting = signal(false);
  isApprovingSubmission = signal(false);
  isRejectingSubmission = signal(false);

  selectedModel = signal<string>('');

  isQueueMode = signal(false);
  isMasterOrAdmin = computed(() => this.authService.hasAnyRole(['MASTER', 'ADMIN']));

  // Fixed: filter by current user's ID, not just any pending submission
  myPendingSubmission = computed(() => {
    const currentUserId = this.authService.getCurrentUser()?.id;
    if (!currentUserId) return undefined;
    return this.state.submissions().find(
      s => s.status === 'PENDING' && s.submittedById === currentUserId
    );
  });

  userInitials = computed(() => {
    const name = this.authService.getCurrentUser()?.name ?? '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  });

  errorPanelCollapsed = signal(false);

  showRequestChangesDialog = false;
  showEscalateDialog = false;
  showReassignDialog = false;
  requestChangesNote = '';
  escalateReason = '';

  allUsers = signal<User[]>([]);
  selectedReassignUserIds: string[] = [];

  pageStatusOptions = [
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
    this.chatService.contentAccepted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((content) => {
        const pageId = this.currentPageId();
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
      if (!segId) {
        this.state.segmentCorrections.set([]);
        if (this.state.rightPanelMode() === 'segment-reviews') {
          this.state.rightPanelMode.set('chat');
        }
        return;
      }

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

      // Load segment corrections for master/admin
      if (pageId && this.isMasterOrAdmin()) {
        this.state.isLoadingSegmentCorrections.set(true);
        this.state.segmentCorrections.set([]);
        this.submissionsService.getSegmentCorrections(pageId, segId).subscribe({
          next: (res) => {
            this.state.segmentCorrections.set(res.data);
            this.state.isLoadingSegmentCorrections.set(false);
          },
          error: () => {
            this.state.segmentCorrections.set([]);
            this.state.isLoadingSegmentCorrections.set(false);
          },
        });
        if (this.state.rightPanelMode() !== 'submissions') {
          this.state.rightPanelMode.set('segment-reviews');
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.isQueueMode.set(this.route.snapshot.data['mode'] === 'queue');
    const id = this.route.snapshot.paramMap.get('pageId');
    if (id) {
      this.loadPageData(id);
    }
    this.apiService.getUsers().subscribe({
      next: (users) => this.allUsers.set(users),
      error: () => {},
    });
  }

  loadPageData(pageId: string) {
    this.loadingPageId = pageId;
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
        if (this.loadingPageId !== pageId) return;

        const approvals: Record<string, boolean> = (page as any).segmentApprovals ?? {};
        this.state.approvedSegmentIds.set(
          new Set(Object.entries(approvals).filter(([, v]) => v).map(([k]) => k))
        );

        const baseTargetHtml = page.translatedHtml || '';
        this.baseTargetHtml.set(baseTargetHtml);
        this.currentPageId.set(page.id);

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
          sourceHtml: this.sanitizer.bypassSecurityTrustHtml(page.originalHtml || ''),
          targetHtml: this.sanitizer.bypassSecurityTrustHtml(baseTargetHtml),
        });

        this.loadEdits(pageId, baseTargetHtml);
        this.loadPageErrors(pageId);
        this.loadSubmissions(pageId);
        this.selectedModel.set(project.translationModel || '');
        this.loading.set(false);
        this.loadSiblings(page.id);
      },
      error: (err) => {
        if (this.loadingPageId !== pageId) return;
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
        this.errorPanelCollapsed.set(false);
        // Auto-open the issues panel when errors are found
        if (errors.length > 0 && this.state.rightPanelMode() !== 'submissions') {
          this.openIssuesPanel();
        }
      },
      error: (err) => {
        faro.api?.pushError(new Error('Failed to load page errors'), { context: { pageId, error: String(err) } });
        this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Could not load page quality issues.' });
      },
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

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
        const changedCount = diffs.filter((p: any) => p.added || p.removed).length;

        if (changedCount > this.INLINE_DIFF_THRESHOLD) {
          el.innerHTML = `<span class="diff-stacked"><span class="diff-stacked-original">${this.escapeHtml(original)}</span><span class="diff-stacked-edited">${this.escapeHtml(edit.editedText)}</span></span>`;
        } else {
          let newHtml = '';
          diffs.forEach((part: any) => {
            if (part.added) {
              newHtml += `<ins class="diff-added">${this.escapeHtml(part.value)}</ins>`;
            } else if (part.removed) {
              newHtml += `<del class="diff-removed">${this.escapeHtml(part.value)}</del>`;
            } else {
              newHtml += `<span>${this.escapeHtml(part.value)}</span>`;
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

  private guardNavigation(): boolean {
    if (this.state.editingSegmentId()) {
      this.messageService.add({ severity: 'warn', summary: 'Finish editing', detail: 'Please save or cancel your current edit before navigating.' });
      return false;
    }
    return true;
  }

  goToPrevPage() {
    if (!this.guardNavigation()) return;
    const id = this.state.prevPageId();
    if (id) {
      this.loadPageData(id);
    }
  }

  goToNextPage() {
    if (!this.guardNavigation()) return;
    const id = this.state.nextPageId();
    if (id) {
      this.loadPageData(id);
    }
  }

  onSidebarPageSelect(pageId: string) {
    if (!this.guardNavigation()) return;
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
    this.isApproving.set(true);
    this.apiService.approvePage(pageId).subscribe({
      next: () => {
        this.isApproving.set(false);
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Page approved.' });
        this.skipPage();
      },
      error: () => {
        this.isApproving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to approve page.' });
      },
    });
  }

  revokePage() {
    const pageId = this.pageData()?.id;
    if (!pageId) return;
    this.isRevoking.set(true);
    this.apiService.revokePage(pageId).subscribe({
      next: (page) => {
        this.isRevoking.set(false);
        this.pageData.update(p => p ? { ...p, status: page.status } : p);
        this.messageService.add({ severity: 'info', summary: 'Revoked', detail: 'Approval revoked.' });
      },
      error: () => {
        this.isRevoking.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to revoke approval.' });
      },
    });
  }

  submitForReview() {
    const pageId = this.pageData()?.id;
    if (!pageId) return;
    this.isSubmittingPage.set(true);
    this.apiService.submitPageForReview(pageId).subscribe({
      next: (page) => {
        this.isSubmittingPage.set(false);
        this.pageData.update(p => p ? { ...p, submittedAt: (page as any).submittedAt } : p);
        this.messageService.add({ severity: 'success', summary: 'Submitted', detail: 'Page submitted for master review.' });
      },
      error: () => {
        this.isSubmittingPage.set(false);
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

  submitAddReviewer(userId: string) {
    const pageId = this.pageData()?.id;
    if (!pageId || !userId) return;
    this.apiService.addReviewer(pageId, userId).subscribe({
      next: (page) => {
        this.pageData.update(p => p ? { ...p, reviewers: (page as any).reviewers || p.reviewers } : p);
        this.messageService.add({ severity: 'success', summary: 'Reviewer added', life: 1500 });
      },
      error: () => {
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

  removeReviewerFromPage(userId: string) {
    const pageId = this.pageData()?.id;
    if (!pageId) return;
    this.apiService.removeReviewer(pageId, userId).subscribe({
      next: () => {
        this.pageData.update(p => p ? { ...p, reviewers: p.reviewers.filter(r => r.userId !== userId) } : p);
        this.messageService.add({ severity: 'success', summary: 'Removed', detail: 'Reviewer removed.', life: 1500 });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to remove reviewer.' });
      },
    });
  }

  // ─── Review Submissions ─────────────────────────────────────────────

  loadSubmissions(pageId: string) {
    this.submissionsService.getSubmissions(pageId).subscribe({
      next: (res) => {
        this.state.submissions.set(res.data);
      },
      error: (err) => {
        faro.api?.pushError(new Error('Failed to load submissions'), { context: { pageId, error: String(err) } });
      },
    });
  }

  submitReview() {
    const pageId = this.pageData()?.id;
    if (!pageId) return;
    this.isSubmittingReview.set(true);
    this.submissionsService.submitReview(pageId).subscribe({
      next: (submission) => {
        this.isSubmittingReview.set(false);
        this.pageData.update(p => p ? { ...p, submittedAt: submission.createdAt } : p);
        this.state.submissions.update((subs) => [submission, ...subs]);
        this.loadEdits(pageId);
        this.messageService.add({ severity: 'success', summary: 'Submitted', detail: 'Your corrections have been submitted for master review.' });
      },
      error: (err: any) => {
        this.isSubmittingReview.set(false);
        const detail = err?.error?.message || 'Failed to submit review.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  unsubmitReview(submissionId: string) {
    const pageId = this.pageData()?.id;
    if (!pageId) return;
    this.isUnsubmitting.set(true);
    this.submissionsService.unsubmitReview(pageId, submissionId).subscribe({
      next: () => {
        this.isUnsubmitting.set(false);
        this.state.submissions.update((subs) => subs.filter((s) => s.id !== submissionId));
        this.loadEdits(pageId);
        this.loadSubmissions(pageId);
        this.messageService.add({ severity: 'info', summary: 'Unsubmitted', detail: 'Your submission has been withdrawn.' });
      },
      error: (err: any) => {
        this.isUnsubmitting.set(false);
        const detail = err?.error?.message || 'Failed to unsubmit review.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  approveSubmission(submissionId: string) {
    const pageId = this.pageData()?.id;
    if (!pageId) return;
    this.isApprovingSubmission.set(true);
    this.submissionsService.approveSubmission(pageId, submissionId).subscribe({
      next: () => {
        this.isApprovingSubmission.set(false);
        this.loadSubmissions(pageId);
        this.loadEdits(pageId);
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Submission approved and corrections applied.' });
      },
      error: (err: any) => {
        this.isApprovingSubmission.set(false);
        const detail = err?.error?.message || 'Failed to approve submission.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  rejectSubmission(submissionId: string) {
    const pageId = this.pageData()?.id;
    if (!pageId) return;
    this.isRejectingSubmission.set(true);
    this.submissionsService.rejectSubmission(pageId, submissionId).subscribe({
      next: (submission) => {
        this.isRejectingSubmission.set(false);
        this.state.submissions.update((subs) => subs.map((s) => (s.id === submissionId ? { ...s, status: 'REJECTED' } : s)));
        this.messageService.add({ severity: 'info', summary: 'Rejected', detail: 'Submission rejected.' });
      },
      error: (err: any) => {
        this.isRejectingSubmission.set(false);
        const detail = err?.error?.message || 'Failed to reject submission.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
      },
    });
  }

  previewSubmission(submissionId: string) {
    const current = this.state.activeSubmissionId();
    if (current === submissionId) {
      this.state.activeSubmissionId.set(null);
      this.loadEdits(this.pageData()?.id || '');
      return;
    }
    this.state.activeSubmissionId.set(submissionId);
    const submission = this.state.submissions().find((s) => s.id === submissionId);
    if (submission?.items) {
      const mapped = submission.items.map((item) => ({ segmentId: item.segmentId, editedText: item.editedText }));
      this.edits.set(mapped);
      this.state.pageEdits.set(mapped);
      const html = this.baseTargetHtml();
      if (html) {
        const compiled = this.compileHtml(html, mapped);
        this.pageData.update((p) => (p ? { ...p, targetHtml: this.sanitizer.bypassSecurityTrustHtml(compiled) } : p));
      }
    }
  }

  onSegmentCorrectionUse(correction: SegmentReviewCorrection) {
    const pageId = this.pageData()?.id;
    const segId = this.state.activeSegmentId();
    if (!pageId || !segId) return;
    this.projectService.savePageEdit(pageId, segId, correction.editedText).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Applied', detail: "Reviewer's correction applied.", life: 1500 });
        this.loadEdits(pageId);
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to apply correction.' });
      },
    });
  }

  openSubmissionsPanel() {
    this.state.rightPanelCollapsed.set(false);
    this.state.rightPanelMode.set('submissions');
  }

  openChatPanel() {
    this.state.rightPanelCollapsed.set(false);
    this.state.rightPanelMode.set('chat');
  }

  openIssuesPanel() {
    this.state.rightPanelCollapsed.set(false);
    this.state.rightPanelMode.set('issues');
  }

  // ─── Segment Keyboard Navigation ───────────────────────────────
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Don't intercept during text input or content editing
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      this.state.editingSegmentId()
    ) return;

    switch (true) {
      case event.key === 'j' && !event.metaKey && !event.ctrlKey:
        event.preventDefault();
        this.navigateSegment('next');
        break;
      case event.key === 'k' && !event.metaKey && !event.ctrlKey:
        event.preventDefault();
        this.navigateSegment('prev');
        break;
      case event.key === 'Escape':
        this.state.setActiveSegment(null);
        break;
      case (event.metaKey || event.ctrlKey) && event.key === '/':
        event.preventDefault();
        this.openChatPanel();
        break;
    }
  }

  navigateSegment(direction: 'next' | 'prev') {
    const segments = Array.from(
      document.querySelectorAll('.target-col .segment')
    ) as HTMLElement[];
    if (!segments.length) return;

    const currentId = this.state.activeSegmentId();
    if (!currentId) {
      const first = segments[0];
      if (first?.id) this.state.setActiveSegment(first.id);
      return;
    }

    const idx = segments.findIndex(s => s.id === currentId);
    const nextIdx = direction === 'next' ? idx + 1 : idx - 1;
    const next = segments[nextIdx];
    if (next?.id) {
      const sourceEl = document.querySelector(`.source-col #${CSS.escape(next.id)}`);
      this.state.activeSourceText.set(sourceEl?.textContent?.trim() || '');
      this.state.setActiveSegment(next.id);
    }
  }
}
