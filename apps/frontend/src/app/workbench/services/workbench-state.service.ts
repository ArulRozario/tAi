import { Injectable, signal, computed } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { SegmentError } from '../../core/services/api.service';
import { ReviewSubmission, SegmentReviewCorrection } from './submissions.service';

export type RightPanelMode = 'chat' | 'submissions' | 'segment-reviews' | 'issues';

export interface WorkbenchPage {
  id: string;
  projectId: string;
  pageNum: number;
  projectName: string;
  styleGuideName?: string;
  status: string;
  submittedAt?: string | null;
  sourceLang: string;
  targetLang: string;
  reviewers: any[];
  sourceHtml: SafeHtml;
  targetHtml: SafeHtml;
}

@Injectable({
  providedIn: 'root'
})
export class WorkbenchStateService {
  // --- Layout State ---
  zoomLevel = signal<number>(100);
  viewMode = signal<'side-by-side' | 'overlay'>('side-by-side');
  overlayColumn = signal<'source' | 'target'>('target');
  sourceViewMode = signal<'html' | 'image'>('html');
  rightPanelCollapsed = signal<boolean>(false);
  leftPanelCollapsed = signal<boolean>(false);

  // --- Page State ---
  pageData = signal<WorkbenchPage | null>(null);
  loading = signal(true);
  prevPageId = signal<string | null>(null);
  nextPageId = signal<string | null>(null);

  // --- Segment State ---
  activeSegmentId = signal<string | null>(null);
  editingSegmentId = signal<string | null>(null);
  hoveredSegmentId = signal<string | null>(null);
  maxPageHeight = signal<number>(0);
  syncScroll = signal<{ from: 'source' | 'target'; percentage: number } | null>(null);
  
  // --- Editor State ---
  isSaving = signal(false);
  isAiLoading = signal(false);
  aiSuggestion = signal<string>('');
  editorTop = signal<number>(0);
  activeSourceText = signal<string>('');
  
  // --- Page Metadata ---
  approvedSegmentIds = signal<Set<string>>(new Set());
  totalSegmentCount = signal<number>(0);
  pageErrors = signal<SegmentError[]>([]);
  pageEdits = signal<{ segmentId: string; editedText: string }[]>([]);

  // --- Review Submissions ---
  submissions = signal<ReviewSubmission[]>([]);
  activeSubmissionId = signal<string | null>(null);
  segmentCorrections = signal<SegmentReviewCorrection[]>([]);
  isLoadingSegmentCorrections = signal(false);
  rightPanelMode = signal<RightPanelMode>('chat');
  showCleanDiff = signal<boolean>(false);
  hasWorkingEdits = computed(() => this.pageEdits().length > 0);
  pendingSubmissionCount = computed(() =>
    this.submissions().filter((s) => s.status === 'PENDING').length
  );

  // --- Helpers ---
  setPageData(data: WorkbenchPage | null) {
    this.pageData.set(data);
  }

  setActiveSegment(id: string | null) {
    this.activeSegmentId.set(id);
  }

  setEditingSegment(id: string | null) {
    this.editingSegmentId.set(id);
  }

  setHoveredSegment(id: string | null) {
    this.hoveredSegmentId.set(id);
  }
}
