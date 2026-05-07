import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { KnobModule } from 'primeng/knob';
import { MenuModule } from 'primeng/menu';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { MenuItem } from 'primeng/api';
import { debounceTime, Subject } from 'rxjs';
import { ApiService, PageDetail, Sentence, SentenceError, Page } from '../../core/services/api.service';
import { StatusDotComponent } from '../../shared/ui/status-dot/status-dot.component';

interface DocBlock {
  kind: 'h1' | 'h2' | 'h3' | 'p' | 'sentence';
  text?: string;
  sentenceNum?: number;
}

function parseMarkdown(md: string | null | undefined): DocBlock[] {
  if (!md) return [];
  return md.split('\n').map((line): DocBlock => {
    const sMatch = line.match(/^\{\{SENTENCE_(\d+)\}\}$/);
    if (sMatch) return { kind: 'sentence', sentenceNum: parseInt(sMatch[1], 10) };
    if (line.startsWith('### ')) return { kind: 'h3', text: line.slice(4) };
    if (line.startsWith('## ')) return { kind: 'h2', text: line.slice(3) };
    if (line.startsWith('# ')) return { kind: 'h1', text: line.slice(2) };
    return { kind: 'p', text: line };
  }).filter(b => b.kind === 'sentence' || (b.text !== undefined && b.text.trim() !== ''));
}

function severityOrder(s: string): number {
  return { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[s] ?? 4;
}

@Component({
  selector: 'app-workbench',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    ButtonModule, KnobModule, MenuModule, TextareaModule,
    TooltipModule, DialogModule, AvatarModule, TagModule,
    StatusDotComponent,
  ],
  template: `
    <div class="page--full">
      <!-- Toolbar -->
      <div class="toolbar">
        <button pButton icon="pi pi-arrow-left" [text]="true" class="p-button-sm p-button-text"
                (click)="goBack()" pTooltip="Back"></button>
        <div class="toolbar__sep"></div>

        <!-- Breadcrumb -->
        <span class="text-xs text-text-2 font-medium" *ngIf="page">
          <a [routerLink]="['/projects', page.projectId]"
             class="hover:text-text-1 cursor-pointer transition-colors">{{ page.project?.name ?? 'Project' }}</a>
          <span class="mx-1 muted">/</span>
          <span class="text-text-1">Page {{ page.pageNumber }}</span>
        </span>

        <div class="toolbar__spacer"></div>

        <!-- Nav prev/next in sidebar list -->
        <div class="toolbar__group">
          <button pButton icon="pi pi-chevron-up" [text]="true" class="p-button-sm p-button-text"
                  [disabled]="sidebarIndex <= 0"
                  (click)="navigateSidebar(-1)" pTooltip="Previous page"></button>
          <button pButton icon="pi pi-chevron-down" [text]="true" class="p-button-sm p-button-text"
                  [disabled]="sidebarIndex >= sidebarPages.length - 1"
                  (click)="navigateSidebar(1)" pTooltip="Next page"></button>
        </div>

        <div class="toolbar__sep"></div>

        <!-- View toggle -->
        <div class="toolbar__group">
          <button pButton [text]="true" class="p-button-sm p-button-text text-xs"
                  [class.is-active]="viewMode === 'split'"
                  (click)="viewMode = 'split'" pTooltip="Split view">
            <i class="pi pi-table"></i>
          </button>
          <button pButton [text]="true" class="p-button-sm p-button-text text-xs"
                  [class.is-active]="viewMode === 'source'"
                  (click)="viewMode = 'source'" pTooltip="Source only">
            <i class="pi pi-align-left"></i>
          </button>
          <button pButton [text]="true" class="p-button-sm p-button-text text-xs"
                  [class.is-active]="viewMode === 'target'"
                  (click)="viewMode = 'target'" pTooltip="Target only">
            <i class="pi pi-align-right"></i>
          </button>
        </div>

        <div class="toolbar__sep"></div>

        <!-- Queue mode: Approve + Skip -->
        <ng-container *ngIf="mode === 'queue'">
          <button pButton label="Skip" icon="pi pi-forward" [text]="true"
                  class="p-button-sm p-button-text" (click)="skipPage()"></button>
          <button pButton label="Approve" icon="pi pi-check" severity="success"
                  class="p-button-sm" [loading]="approving" (click)="approvePage()"></button>
        </ng-container>

        <!-- Browse mode: overflow menu -->
        <ng-container *ngIf="mode === 'browse'">
          <button pButton icon="pi pi-ellipsis-h" [text]="true"
                  class="p-button-sm p-button-text" (click)="overflowMenu.toggle($event)"></button>
          <p-menu #overflowMenu [model]="overflowItems" [popup]="true"></p-menu>
        </ng-container>
      </div>

      <!-- Body -->
      <div class="workbench">
        <!-- Left sidebar: page list -->
        <div class="workbench__sidebar">
          <div class="text-xs font-semibold text-text-3 uppercase tracking-wider px-2 mb-2">
            Pages
            <span class="text-text-3 font-normal ml-1">({{ sidebarPages.length }})</span>
          </div>

          <div class="text-xs text-text-3 py-4 text-center" *ngIf="loadingSidebar">Loading…</div>

          <button *ngFor="let p of sidebarPages"
                  class="page-pill"
                  [class.is-active]="p.id === pageId"
                  (click)="navigateToPage(p.id)">
            <app-status-dot [status]="p.status"></app-status-dot>
            <span class="font-medium text-text-1 text-sm">P{{ p.pageNumber }}</span>
            <span *ngIf="errorCountForPage(p) > 0"
                  class="ml-auto text-xs text-error font-semibold">
              {{ errorCountForPage(p) }}
            </span>
          </button>

          <!-- Reviewer Notes -->
          <div class="mt-auto pt-4 border-t border-border">
            <div class="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Notes</div>
            <textarea pTextarea rows="4"
                      class="w-full bg-surface-2 border-border text-text-1 text-xs rounded resize-none p-2"
                      placeholder="Reviewer notes…"
                      [(ngModel)]="reviewerNotes"
                      (ngModelChange)="notesChanged$.next($event)"></textarea>
          </div>
        </div>

        <!-- Center: dual PDF panes -->
        <div class="workbench__main">
          <!-- Source pane -->
          <div class="pdf-pane" *ngIf="viewMode !== 'target'">
            <div class="pdf-pane__header">
              <span class="font-semibold text-text-1">Source</span>
              <span class="text-text-3 mono">{{ page?.project?.sourceLang ?? '—' }}</span>
            </div>
            <div class="pdf-pane__body">
              <ng-container *ngFor="let block of sourceBlocks">
                <h1 *ngIf="block.kind === 'h1'" class="text-xl font-bold text-text-1 mt-4 mb-2">{{ block.text }}</h1>
                <h2 *ngIf="block.kind === 'h2'" class="text-lg font-semibold text-text-1 mt-3 mb-1">{{ block.text }}</h2>
                <h3 *ngIf="block.kind === 'h3'" class="text-base font-semibold text-text-2 mt-2 mb-1">{{ block.text }}</h3>
                <p *ngIf="block.kind === 'p'" class="text-text-2 mb-2">{{ block.text }}</p>
                <div *ngIf="block.kind === 'sentence'" class="sentence-row"
                     [class.is-selected]="selectedSentenceNum === block.sentenceNum"
                     [class.has-error-high]="sentenceHasHighError(block.sentenceNum!)"
                     [class.has-error-med]="sentenceHasMedError(block.sentenceNum!)"
                     (click)="selectSentence(block.sentenceNum!)">
                  <!-- Approval toggle -->
                  <div class="approve-toggle"
                       [class.is-approved]="getSentence(block.sentenceNum!)?.isApproved"
                       (click)="$event.stopPropagation(); toggleApproval(block.sentenceNum!)">
                    <i *ngIf="getSentence(block.sentenceNum!)?.isApproved" class="pi pi-check text-white" style="font-size:9px"></i>
                  </div>
                  <span class="text-xs text-text-3 mono shrink-0 mt-0.5">{{ block.sentenceNum }}</span>
                  <span class="text-text-1 flex-1">{{ getSentence(block.sentenceNum!)?.originalText }}</span>
                </div>
              </ng-container>
              <div *ngIf="sourceBlocks.length === 0 && !loading" class="text-text-3 text-sm italic">
                No source content yet.
              </div>
            </div>
          </div>

          <!-- Target pane -->
          <div class="pdf-pane" *ngIf="viewMode !== 'source'">
            <div class="pdf-pane__header">
              <span class="font-semibold text-text-1">Translation</span>
              <span class="text-text-3 mono">{{ page?.project?.targetLang ?? '—' }}</span>
            </div>
            <div class="pdf-pane__body">
              <ng-container *ngFor="let block of sourceBlocks">
                <h1 *ngIf="block.kind === 'h1'" class="text-xl font-bold text-text-1 mt-4 mb-2">{{ block.text }}</h1>
                <h2 *ngIf="block.kind === 'h2'" class="text-lg font-semibold text-text-1 mt-3 mb-1">{{ block.text }}</h2>
                <h3 *ngIf="block.kind === 'h3'" class="text-base font-semibold text-text-2 mt-2 mb-1">{{ block.text }}</h3>
                <p *ngIf="block.kind === 'p'" class="text-text-2 mb-2">{{ block.text }}</p>
                <div *ngIf="block.kind === 'sentence'" class="sentence-row ta"
                     [class.is-selected]="selectedSentenceNum === block.sentenceNum"
                     [class.has-error-high]="sentenceHasHighError(block.sentenceNum!)"
                     [class.has-error-med]="sentenceHasMedError(block.sentenceNum!)"
                     (click)="selectSentence(block.sentenceNum!)">
                  <span class="text-xs text-text-3 mono shrink-0 mt-0.5">{{ block.sentenceNum }}</span>
                  <span class="text-text-1 flex-1">
                    {{ getSentence(block.sentenceNum!)?.translatedText ?? getSentence(block.sentenceNum!)?.aiTranslatedText ?? '' }}
                  </span>
                  <span *ngIf="getOpenErrors(block.sentenceNum!).length > 0"
                        class="text-xs text-error font-semibold ml-2 shrink-0">
                    {{ getOpenErrors(block.sentenceNum!).length }}
                  </span>
                </div>
              </ng-container>
            </div>
          </div>
        </div>

        <!-- Right inspector -->
        <div class="workbench__inspector">
          <!-- Quality ring -->
          <div class="flex flex-col items-center gap-1" *ngIf="page">
            <div class="text-xs font-semibold text-text-3 uppercase tracking-wider self-start mb-1">Quality</div>
            <p-knob [(ngModel)]="qualityDisplay" [readonly]="true" [size]="80"
                    valueColor="var(--accent)" rangeColor="var(--surface-2)"
                    [min]="0" [max]="100"></p-knob>
            <span class="text-sm font-mono font-bold"
                  [class.text-success]="qualityDisplay >= 80"
                  [class.text-warning]="qualityDisplay >= 60 && qualityDisplay < 80"
                  [class.text-error]="qualityDisplay < 60">
              {{ qualityDisplay }}%
            </span>
          </div>

          <hr class="border-border my-1">

          <!-- Selected sentence errors -->
          <div *ngIf="selectedSentence">
            <div class="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">
              Sentence {{ selectedSentenceNum }} · Errors ({{ getOpenErrors(selectedSentenceNum!).length }})
            </div>
            <div *ngFor="let err of getOpenErrors(selectedSentenceNum!)"
                 class="error-card" [class]="'error-card severity-' + err.severity">
              <div class="row row--between mb-1">
                <span class="text-xs font-bold"
                      [class.text-error]="err.severity === 'CRITICAL' || err.severity === 'HIGH'"
                      [class.text-warning]="err.severity === 'MEDIUM'"
                      [class.text-text-2]="err.severity === 'LOW'">
                  {{ err.severity }}
                </span>
                <span class="text-xs text-text-3">{{ err.category }}</span>
              </div>
              <p class="text-xs text-text-2 mb-2">{{ err.issueDescription }}</p>
              <div *ngIf="err.suggestedText" class="mb-2">
                <div class="text-xs text-text-3 mb-1">Suggestion:</div>
                <div class="text-xs text-text-1 bg-surface-2 rounded px-2 py-1 font-mono">{{ err.suggestedText }}</div>
              </div>
              <button pButton label="Apply fix" icon="pi pi-check" severity="success"
                      class="p-button-sm w-full" [loading]="applyingError === err.id"
                      (click)="applyError(err)"></button>
            </div>
            <div *ngIf="getOpenErrors(selectedSentenceNum!).length === 0"
                 class="text-xs text-text-3 py-2 text-center">No open errors</div>
          </div>

          <div *ngIf="!selectedSentence" class="text-xs text-text-3 text-center py-4">
            Click a sentence to inspect errors
          </div>

          <hr class="border-border my-1">

          <!-- Page-level actions -->
          <div>
            <div class="text-xs font-semibold text-text-3 uppercase tracking-wider mb-3">Actions</div>
            <div class="col gap-2">
              <button pButton label="Approve page" icon="pi pi-check-circle" severity="success"
                      class="w-full p-button-sm" [loading]="approving"
                      (click)="approvePage()"></button>
              <button pButton label="Request changes" icon="pi pi-refresh"
                      class="w-full p-button-sm p-button-text"
                      (click)="showRequestChanges = true"></button>
              <button pButton label="Escalate" icon="pi pi-exclamation-triangle" severity="warn"
                      class="w-full p-button-sm p-button-text"
                      (click)="showEscalate = true"></button>
            </div>
          </div>

          <!-- Reviewers -->
          <div *ngIf="page?.reviewers && page!.reviewers!.length > 0">
            <hr class="border-border my-1">
            <div class="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Reviewers</div>
            <div class="row flex-wrap gap-2">
              <p-avatar *ngFor="let r of page!.reviewers"
                        [label]="initials(r.name)" shape="circle"
                        [pTooltip]="r.name"></p-avatar>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Request Changes Dialog -->
    <p-dialog header="Request Changes" [(visible)]="showRequestChanges"
              [modal]="true" [style]="{width: '420px'}" [closable]="true">
      <p class="text-sm text-text-2 mb-3">Describe what needs to be fixed. The page will be re-queued for translation.</p>
      <textarea pTextarea rows="4" class="w-full" placeholder="Describe the required changes…"
                [(ngModel)]="requestChangesNote"></textarea>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" [text]="true" (click)="showRequestChanges = false"></button>
        <button pButton label="Send" severity="warn" [loading]="requestingChanges"
                [disabled]="!requestChangesNote.trim()"
                (click)="submitRequestChanges()"></button>
      </ng-template>
    </p-dialog>

    <!-- Escalate Dialog -->
    <p-dialog header="Escalate Page" [(visible)]="showEscalate"
              [modal]="true" [style]="{width: '420px'}" [closable]="true">
      <p class="text-sm text-text-2 mb-3">Escalate to a senior reviewer. Provide context below.</p>
      <textarea pTextarea rows="4" class="w-full" placeholder="Escalation reason…"
                [(ngModel)]="escalateReason"></textarea>
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" [text]="true" (click)="showEscalate = false"></button>
        <button pButton label="Escalate" severity="danger" [loading]="escalating"
                [disabled]="!escalateReason.trim()"
                (click)="submitEscalate()"></button>
      </ng-template>
    </p-dialog>
  `,
})
export class WorkbenchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  pageId = '';
  mode: 'browse' | 'queue' = 'browse';
  page: PageDetail | null = null;
  loading = true;

  sidebarPages: Page[] = [];
  loadingSidebar = true;

  sourceBlocks: DocBlock[] = [];
  sentenceMap = new Map<number, Sentence>();

  selectedSentenceNum: number | null = null;
  get selectedSentence(): Sentence | undefined {
    return this.selectedSentenceNum != null ? this.sentenceMap.get(this.selectedSentenceNum) : undefined;
  }

  viewMode: 'split' | 'source' | 'target' = 'split';

  reviewerNotes = '';
  notesChanged$ = new Subject<string>();

  qualityDisplay = 0;

  approving = false;
  applyingError: string | null = null;
  requestingChanges = false;
  escalating = false;

  showRequestChanges = false;
  showEscalate = false;
  requestChangesNote = '';
  escalateReason = '';

  overflowItems: MenuItem[] = [
    { label: 'Request changes', icon: 'pi pi-refresh', command: () => (this.showRequestChanges = true) },
    { label: 'Escalate', icon: 'pi pi-exclamation-triangle', command: () => (this.showEscalate = true) },
  ];

  get sidebarIndex(): number {
    return this.sidebarPages.findIndex(p => p.id === this.pageId);
  }

  ngOnInit() {
    this.pageId = this.route.snapshot.paramMap.get('pageId') ?? '';
    this.mode = (this.route.snapshot.data['mode'] as 'browse' | 'queue') ?? 'browse';

    this.loadPage();

    this.notesChanged$.pipe(
      debounceTime(800),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(notes => {
      if (this.page) {
        this.api.patchPage(this.pageId, { notes } as any).subscribe({ error: () => {} });
      }
    });
  }

  private loadPage() {
    this.loading = true;
    this.api.getPage(this.pageId).subscribe({
      next: (p) => {
        this.page = p;
        this.loading = false;
        this.qualityDisplay = p.quality ?? 0;
        this.reviewerNotes = p.notes ?? '';
        this.sourceBlocks = parseMarkdown(p.sourceMarkdown);
        this.sentenceMap.clear();
        for (const s of p.sentences) {
          this.sentenceMap.set(s.sentenceNumber, s);
        }
        if (p.projectId) this.loadSidebar(p.projectId, (p as any).chapterId ?? undefined);
      },
      error: () => { this.loading = false; },
    });
  }

  private loadSidebar(projectId: string, chapterId?: string) {
    this.loadingSidebar = true;
    const params: Record<string, string> = { projectId, limit: '200' };
    if (chapterId) params['chapterId'] = chapterId;
    this.api.getPages(projectId, chapterId, undefined, 200, 0).subscribe({
      next: (res) => { this.sidebarPages = res.data; this.loadingSidebar = false; },
      error: () => { this.loadingSidebar = false; },
    });
  }

  getSentence(num: number): Sentence | undefined {
    return this.sentenceMap.get(num);
  }

  getOpenErrors(num: number): SentenceError[] {
    const s = this.sentenceMap.get(num);
    if (!s?.errors) return [];
    return s.errors
      .filter(e => e.status === 'OPEN')
      .sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));
  }

  errorCountForPage(p: Page): number {
    return 0; // sidebar page objects don't carry error counts
  }

  sentenceHasHighError(num: number): boolean {
    return this.getOpenErrors(num).some(e => e.severity === 'CRITICAL' || e.severity === 'HIGH');
  }

  sentenceHasMedError(num: number): boolean {
    return !this.sentenceHasHighError(num) && this.getOpenErrors(num).some(e => e.severity === 'MEDIUM');
  }

  selectSentence(num: number) {
    this.selectedSentenceNum = this.selectedSentenceNum === num ? null : num;
  }

  toggleApproval(num: number) {
    const s = this.sentenceMap.get(num);
    if (!s) return;
    const next = !s.isApproved;
    this.api.patchSentence(s.id, { isApproved: next }).subscribe({
      next: (updated) => { this.sentenceMap.set(num, { ...s, ...updated }); },
      error: () => {},
    });
  }

  applyError(err: SentenceError) {
    this.applyingError = err.id;
    this.api.applyError(err.id).subscribe({
      next: (updated) => {
        this.applyingError = null;
        const s = [...this.sentenceMap.entries()].find(([, v]) => v.id === err.sentenceId);
        if (s) {
          const [num, sentence] = s;
          const errors = (sentence.errors ?? []).map(e => e.id === err.id ? updated : e);
          this.sentenceMap.set(num, { ...sentence, errors });
        }
      },
      error: () => { this.applyingError = null; },
    });
  }

  approvePage() {
    if (!this.page) return;
    this.approving = true;
    this.api.approvePage(this.pageId, this.reviewerNotes).subscribe({
      next: () => {
        this.approving = false;
        if (this.mode === 'queue') {
          this.api.getNextInQueue(this.pageId).subscribe({
            next: (r) => {
              if (r.nextPageId) this.router.navigate(['/review', r.nextPageId]);
              else this.router.navigate(['/queue']);
            },
            error: () => this.router.navigate(['/queue']),
          });
        } else {
          this.loadPage();
        }
      },
      error: () => { this.approving = false; },
    });
  }

  submitRequestChanges() {
    if (!this.requestChangesNote.trim()) return;
    this.requestingChanges = true;
    this.api.requestChanges(this.pageId, this.requestChangesNote).subscribe({
      next: () => {
        this.requestingChanges = false;
        this.showRequestChanges = false;
        this.requestChangesNote = '';
        if (this.mode === 'queue') {
          this.api.getNextInQueue(this.pageId).subscribe({
            next: (r) => {
              if (r.nextPageId) this.router.navigate(['/review', r.nextPageId]);
              else this.router.navigate(['/queue']);
            },
            error: () => this.router.navigate(['/queue']),
          });
        }
      },
      error: () => { this.requestingChanges = false; },
    });
  }

  submitEscalate() {
    if (!this.escalateReason.trim()) return;
    this.escalating = true;
    this.api.escalatePage(this.pageId, this.escalateReason).subscribe({
      next: () => {
        this.escalating = false;
        this.showEscalate = false;
        this.escalateReason = '';
        this.router.navigate(['/queue']);
      },
      error: () => { this.escalating = false; },
    });
  }

  skipPage() {
    this.navigateSidebar(1);
  }

  navigateSidebar(delta: number) {
    const idx = this.sidebarIndex + delta;
    if (idx < 0 || idx >= this.sidebarPages.length) return;
    this.navigateToPage(this.sidebarPages[idx].id);
  }

  navigateToPage(id: string) {
    const path = this.mode === 'queue' ? '/review' : '/workbench';
    this.router.navigate([path, id]);
  }

  goBack() {
    if (this.page?.projectId) this.router.navigate(['/projects', this.page.projectId]);
    else this.router.navigate(['/dashboard']);
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
