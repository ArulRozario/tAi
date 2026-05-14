import { Injectable, signal, computed } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

export interface WorkbenchPage {
  id: string;
  projectId: string;
  chapterNum: number;
  pageNum: number;
  projectName: string;
  styleGuideName?: string;
  status: string;
  sourceLang: string;
  targetLang: string;
  assignedTo: string;
  lastAiRun: string;
  metrics: {
    overall: number;
    accuracy: number;
    style: number;
    terms: number;
  };
  aiFeedback: string;
  segments: any[];
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
  sourceViewMode = signal<'html' | 'image'>('html');
  rightPanelCollapsed = signal<boolean>(true);
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
  pageErrors = signal<{ segmentId: string; severity: string; message: string }[]>([]);
  pageEdits = signal<{ segmentId: string; editedText: string }[]>([]);

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
