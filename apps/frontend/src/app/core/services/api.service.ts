import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'REVIEWER' | 'MASTER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  sourceLang: string;
  targetLang: string;
  status: string;
  styleGuideId: string;
  owner?: User;
  pageCount?: number;
  completedCount?: number;
  progress?: number;
  avgQuality?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  projectId: string;
  number: number;
  title?: string;
}

export interface Page {
  id: string;
  projectId: string;
  chapterId?: string;
  pageNumber: number;
  status: string;
  priority: string;
  quality?: number;
  notes?: string;
  assignedAt?: string;
  lastAiRunAt?: string;
  reviewers?: User[];
  project?: { id: string; name: string; sourceLang: string; targetLang: string };
  chapter?: { id: string; number: number; title?: string };
}

export interface SentenceError {
  id: string;
  sentenceId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  location?: string;
  currentText?: string;
  suggestedText?: string;
  issueDescription: string;
  reference?: string;
  aiNote?: string;
  status: 'OPEN' | 'APPLIED' | 'DISMISSED' | 'ESCALATED';
  appliedAt?: string;
  createdAt: string;
}

export interface Sentence {
  id: string;
  pageId: string;
  sentenceNumber: number;
  originalText: string;
  translatedText?: string;
  aiTranslatedText?: string;
  status: string;
  isApproved: boolean;
  confidence?: number;
  errors?: SentenceError[];
}

export interface PageDetail extends Page {
  sourceMarkdown?: string;
  sentences: Sentence[];
}

export interface DashboardStats {
  activeProjects: number;
  activeProjectsDeltaMonth: number;
  pagesTranslated: number;
  pagesTranslatedDeltaWeek: number;
  pendingReview: number;
  pendingReviewDelta: number;
  userQueueCount: number;
  escalationCount: number;
  avgQuality: number;
  avgQualityDelta: number;
  lastSyncAt: string | null;
}

export interface Job {
  id: string;
  type: string;
  status: string;
  progress: number;
  result?: { fileUrl?: string };
  errorMessage?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityHref?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export interface ProjectStats {
  total: number;
  pending: number;
  extracting: number;
  extracted: number;
  translating: number;
  translated: number;
  reviewing: number;
  humanReview: number;
  approved: number;
  rejected: number;
  error: number;
}

export interface GlossaryTerm {
  id: string;
  styleGuideId: string;
  sourceTerm: string;
  targetTerm: string;
  context?: string;
  notes?: string;
}

export interface QueuePage {
  id: string;
  pageNumber: number;
  project: { id: string; name: string };
  chapter?: { id: string; number: number; title?: string };
  status: string;
  priority: string;
  quality?: number;
  assignedAt?: string;
  errorCount: number;
  reviewers: User[];
}

export interface ErrorStat {
  category: string;
  count: number;
  severity: string | null;
  exampleText: string | null;
  resolvedCount: number;
}

export interface Escalation {
  pageId: string;
  project: { id: string; name: string };
  chapter?: { id: string; number: number; title?: string };
  errorCategory: string | null;
  escalatedAt: string;
  escalatedById: string | null;
  summary: string | null;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  readonly base = '/api/v1';

  // ── Auth ──────────────────────────────────────────────────────────────────

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.base}/auth/me`);
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/dashboard/stats`);
  }

  getDashboardThroughput(metric: 'pages' | 'words' = 'pages', weeks = 12): Observable<{ week: string; value: number }[]> {
    return this.http.get<{ week: string; value: number }[]>(`${this.base}/dashboard/throughput`, {
      params: new HttpParams().set('metric', metric).set('weeks', weeks),
    });
  }

  getMyQueue(limit = 5): Observable<Page[]> {
    return this.http.get<Page[]>(`${this.base}/dashboard/my-queue`, {
      params: new HttpParams().set('limit', limit),
    });
  }

  getRecentProjects(limit = 4): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.base}/dashboard/recent-projects`, {
      params: new HttpParams().set('limit', limit),
    });
  }

  getActivityFeed(limit = 10): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.base}/dashboard/activity`, {
      params: new HttpParams().set('limit', limit),
    });
  }

  // ── Projects ──────────────────────────────────────────────────────────────

  getProjects(q?: string, status?: string, limit = 20, offset = 0): Observable<Project[]> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (q) params = params.set('q', q);
    if (status) params = params.set('status', status);
    return this.http.get<Project[]>(`${this.base}/projects`, { params });
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.base}/projects/${id}`);
  }

  createProject(data: { name: string; description?: string; styleGuideId: string; sourceFileId?: string; sourceLang: string; targetLang: string }): Observable<Project> {
    return this.http.post<Project>(`${this.base}/projects`, data);
  }

  patchProject(id: string, data: Partial<Project>): Observable<Project> {
    return this.http.patch<Project>(`${this.base}/projects/${id}`, data);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/projects/${id}`);
  }

  getProjectStats(id: string): Observable<ProjectStats> {
    return this.http.get<ProjectStats>(`${this.base}/projects/${id}/stats`);
  }

  getChapters(projectId: string): Observable<Chapter[]> {
    return this.http.get<Chapter[]>(`${this.base}/projects/${projectId}/chapters`);
  }

  pauseProject(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/projects/${id}/pause`, {});
  }

  resumeProject(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/projects/${id}/resume`, {});
  }

  cancelProjectJobs(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/projects/${id}/cancel-jobs`, {});
  }

  // ── Files ─────────────────────────────────────────────────────────────────

  uploadFile(file: File): Observable<{ fileId: string; filename: string; size: number; url: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ fileId: string; filename: string; size: number; url: string }>(`${this.base}/files/upload`, fd);
  }

  // ── Pages ─────────────────────────────────────────────────────────────────

  getPages(projectId?: string, chapterId?: string, status?: string, limit = 50, offset = 0): Observable<{ data: Page[]; total: number }> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (projectId) params = params.set('projectId', projectId);
    if (chapterId) params = params.set('chapterId', chapterId);
    if (status) params = params.set('status', status);
    return this.http.get<{ data: Page[]; total: number }>(`${this.base}/pages`, { params });
  }

  getPage(id: string): Observable<PageDetail> {
    return this.http.get<PageDetail>(`${this.base}/pages/${id}`);
  }

  patchPage(id: string, data: Partial<Page>): Observable<Page> {
    return this.http.patch<Page>(`${this.base}/pages/${id}`, data);
  }

  approvePage(id: string, notes?: string): Observable<Page> {
    return this.http.post<Page>(`${this.base}/pages/${id}/approve`, { notes });
  }

  requestChanges(id: string, note: string): Observable<Page> {
    return this.http.post<Page>(`${this.base}/pages/${id}/request-changes`, { note });
  }

  escalatePage(id: string, reason: string): Observable<Page> {
    return this.http.post<Page>(`${this.base}/pages/${id}/escalate`, { reason });
  }

  getNextInQueue(id: string): Observable<{ nextPageId: string | null }> {
    return this.http.get<{ nextPageId: string | null }>(`${this.base}/pages/${id}/next-in-queue`);
  }

  applyError(errorId: string): Observable<SentenceError> {
    return this.http.post<SentenceError>(`${this.base}/errors/${errorId}/apply`, {});
  }

  // ── Sentences ─────────────────────────────────────────────────────────────

  patchSentence(id: string, data: Partial<Sentence>): Observable<Sentence> {
    return this.http.patch<Sentence>(`${this.base}/sentences/${id}`, data);
  }

  resetSentenceTranslation(id: string): Observable<Sentence> {
    return this.http.post<Sentence>(`${this.base}/sentences/${id}/reset-translation`, {});
  }

  addReviewer(pageId: string, userId: string): Observable<Page> {
    return this.http.post<Page>(`${this.base}/pages/${pageId}/add-reviewer`, { reviewerId: userId });
  }

  reassignReviewers(pageId: string, userIds: string[]): Observable<Page> {
    return this.http.post<Page>(`${this.base}/pages/${pageId}/reassign`, { reviewerIds: userIds });
  }

  // ── Glossary ──────────────────────────────────────────────────────────────

  lookupGlossary(term: string, styleGuideId: string): Observable<GlossaryTerm[]> {
    return this.http.get<GlossaryTerm[]>(`${this.base}/glossary/lookup`, {
      params: new HttpParams().set('term', term).set('styleGuideId', styleGuideId),
    });
  }

  getGlossary(styleGuideId: string, limit = 100, offset = 0): Observable<{ data: GlossaryTerm[]; total: number }> {
    return this.http.get<{ data: GlossaryTerm[]; total: number }>(`${this.base}/glossary`, {
      params: new HttpParams().set('styleGuideId', styleGuideId).set('limit', limit).set('offset', offset),
    });
  }

  createGlossaryTerm(data: { styleGuideId: string; sourceTerm: string; targetTerm: string; context?: string; notes?: string }): Observable<GlossaryTerm> {
    return this.http.post<GlossaryTerm>(`${this.base}/glossary`, data);
  }

  updateGlossaryTerm(id: string, data: Partial<GlossaryTerm>): Observable<GlossaryTerm> {
    return this.http.put<GlossaryTerm>(`${this.base}/glossary/${id}`, data);
  }

  deleteGlossaryTerm(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/glossary/${id}`);
  }

  bulkImportGlossary(styleGuideId: string, file: File): Observable<{ imported: number }> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('styleGuideId', styleGuideId);
    return this.http.post<{ imported: number }>(`${this.base}/glossary/bulk`, fd);
  }

  // ── Queue ─────────────────────────────────────────────────────────────────

  getQueue(params?: Record<string, string>): Observable<{ data: QueuePage[]; total: number }> {
    let hp = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => (hp = hp.set(k, v)));
    return this.http.get<{ data: QueuePage[]; total: number }>(`${this.base}/queue`, { params: hp });
  }

  getQueueErrorStats(): Observable<ErrorStat[]> {
    return this.http.get<ErrorStat[]>(`${this.base}/queue/error-stats`);
  }

  getEscalations(): Observable<Escalation[]> {
    return this.http.get<Escalation[]>(`${this.base}/escalations`);
  }

  resolveEscalation(id: string, resolution: string): Observable<Page> {
    return this.http.post<Page>(`${this.base}/pages/${id}/resolve-escalation`, { resolution });
  }

  // ── Users ─────────────────────────────────────────────────────────────────

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`);
  }

  inviteUser(data: { name: string; email: string; role: string }): Observable<User> {
    return this.http.post<User>(`${this.base}/users/invite`, data);
  }

  patchUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.base}/users/${id}`, data);
  }

  // ── Models ────────────────────────────────────────────────────────────────

  getModels(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/models`);
  }

  updateModel(agentType: string, data: unknown): Observable<unknown> {
    return this.http.put<unknown>(`${this.base}/models/${agentType}`, data);
  }

  testModelConnection(data: unknown): Observable<{ online: boolean; latencyMs: number; error?: string }> {
    return this.http.post<{ online: boolean; latencyMs: number; error?: string }>(`${this.base}/models/test`, data);
  }

  // ── Jobs ──────────────────────────────────────────────────────────────────

  getJob(id: string): Observable<Job> {
    return this.http.get<Job>(`${this.base}/jobs/${id}`);
  }

  // ── Export ────────────────────────────────────────────────────────────────

  exportProject(projectId: string, format = 'text', scope = 'approved'): Observable<{ jobId: string }> {
    return this.http.post<{ jobId: string }>(`${this.base}/export/project/${projectId}`, { format, scope });
  }

  // ── Chat ──────────────────────────────────────────────────────────────────

  getChatSessions(context: string, entityId?: string): Observable<any[]> {
    let hp = new HttpParams().set('context', context);
    if (entityId) hp = hp.set('entityId', entityId);
    return this.http.get<any[]>(`${this.base}/chat/sessions`, { params: hp });
  }

  createChatSession(data: { context: string; entityId?: string; modelProvider?: string; modelName?: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/chat/sessions`, data);
  }

  getChatSession(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/chat/sessions/${id}`);
  }

  addChatMessage(id: string, content: string, mode?: string): Observable<any> {
    return this.http.post<any>(`${this.base}/chat/sessions/${id}/messages`, { content, mode });
  }

  getQuickPrompts(context: string, mode?: string): Observable<string[]> {
    let hp = new HttpParams().set('context', context);
    if (mode) hp = hp.set('mode', mode);
    return this.http.get<string[]>(`${this.base}/chat/quick-prompts`, { params: hp });
  }
}
