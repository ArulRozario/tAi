import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export interface Project {
  id: string;
  name: string;
  description?: string;
  sourceLang: string;
  targetLang: string;
  styleGuideId: string;
  collectionId?: string | null;
  status: string;
  ownerId?: string;
  sourceFileId?: string;
  translationModel?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    pages: number;
    chapters: number;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  styleGuide?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  collection?: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    parentId: string | null;
  } | null;
  stats?: ProjectStats;
  pages?: Page[];
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
  escalated: number;
  error: number;
}

export interface Chapter {
  id: string;
  projectId: string;
  chapterNumber: number;
  title: string;
  status: string;
  pages?: Page[];
}

export interface PageReviewer {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; role: string; avatarUrl?: string | null };
  isPrimary: boolean;
  assignedAt: string;
}

export interface Page {
  id: string;
  projectId: string;
  chapterId?: string;
  pageNumber: number;
  status: string;
  quality?: number;
  originalHtml?: string;
  translatedHtml?: string;
  reviewers?: PageReviewer[];
}

export interface PaginatedProjects {
  data: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  sourceLang: string;
  targetLang: string;
  styleGuideId: string;
  sourceFileId?: string;
  translationModel?: string;
}

export interface FileUploadResponse {
  fileId: string;
  filename: string;
  size: number;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiUrl = '/api/v1/projects';
  private uploadUrl = '/api/v1/files/upload';
  private auth = inject(AuthService);

  constructor(private http: HttpClient) {}

  /** Appends the JWT as ?token= so native EventSource/img requests can authenticate */
  private tokenParam(): string {
    const t = this.auth.getAccessToken();
    return t ? `token=${encodeURIComponent(t)}` : '';
  }

  /** Builds a URL with the token query param appended */
  withToken(url: string): string {
    const param = this.tokenParam();
    if (!param) return url;
    return url.includes('?') ? `${url}&${param}` : `${url}?${param}`;
  }

  getProjects(page = 1, limit = 20, assignedToMe = false): Observable<PaginatedProjects> {
    const param = assignedToMe ? '&assignedToMe=true' : '';
    return this.http.get<PaginatedProjects>(`${this.apiUrl}?page=${page}&limit=${limit}${param}`);
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  getChapters(projectId: string): Observable<Chapter[]> {
    return this.http.get<Chapter[]>(`${this.apiUrl}/${projectId}/chapters`);
  }

  getStats(projectId: string): Observable<ProjectStats> {
    return this.http.get<ProjectStats>(`${this.apiUrl}/${projectId}/stats`);
  }

  getPage(pageId: string): Observable<Page> {
    return this.http.get<Page>(`/api/v1/pages/${pageId}`);
  }

  getProjectPages(projectId: string, limit = 999, offset = 0): Observable<{
    data: Page[];
    pagination: {
      offset: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    return this.http.get<any>(
      `/api/v1/pages?projectId=${projectId}&limit=${limit}&offset=${offset}`
    );
  }

  createProject(dto: CreateProjectDto): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, dto);
  }

  updateProject(id: string, dto: Partial<CreateProjectDto>): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${id}`, dto);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadFile(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FileUploadResponse>(this.uploadUrl, formData);
  }

  exportProject(id: string, format: 'pdf' | 'docx' | 'html' | 'text'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/export/${format}`, {
      responseType: 'blob',
    });
  }

  /** Workbench: get prev/next sibling page IDs */
  getPageSiblings(pageId: string): Observable<{
    prevPageId: string | null;
    prevPageNumber: number | null;
    nextPageId: string | null;
    nextPageNumber: number | null;
    currentPageNumber: number;
  }> {
    return this.http.get<any>(`/api/v1/pages/${pageId}/siblings`);
  }

  /** Workbench: replace the source image of a page */
  replacePageImage(pageId: string, file: File): Observable<Page> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Page>(`/api/v1/pages/${pageId}/replace-image`, formData);
  }

  /** Workbench: retranslate a single page */
  retranslatePage(
    pageId: string,
    modelOverride?: string,
  ): Observable<{ success: boolean; pageId: string; status: string }> {
    return this.http.post<any>(`/api/v1/pages/${pageId}/retranslate`, {
      modelOverride,
    });
  }

  /** Workbench: update page status */
  updatePageStatus(pageId: string, status: string): Observable<Page> {
    return this.http.patch<Page>(`/api/v1/pages/${pageId}`, { status });
  }

  /** Workbench: get page edits */
  getPageEdits(pageId: string): Observable<{ id: string; segmentId: string; editedText: string; editedById: string; createdAt: string }[]> {
    return this.http.get<any[]>(`/api/v1/pages/${pageId}/edits`);
  }

  /** Workbench: save a segment edit */
  savePageEdit(pageId: string, segmentId: string, editedText: string): Observable<any> {
    return this.http.post<any>(`/api/v1/pages/${pageId}/edits`, { segmentId, editedText });
  }

  /** Workbench: reset a single segment edit */
  resetPageEdit(pageId: string, segmentId: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/pages/${pageId}/edits/${segmentId}`);
  }

  /** Workbench: reset all edits for a page */
  resetAllPageEdits(pageId: string): Observable<{ deletedCount: number }> {
    return this.http.delete<{ deletedCount: number }>(`/api/v1/pages/${pageId}/edits`);
  }

  /** Workbench: retranslate a single segment using AI */
  retranslateSegment(
    pageId: string,
    segmentId: string,
    prompt: string,
    modelOverride?: string,
  ): Observable<{
    segmentId: string;
    sourceText: string;
    currentTranslation: string;
    newTranslation: string;
    model: string;
  }> {
    return this.http.post<any>(`/api/v1/pages/${pageId}/segments/${segmentId}/retranslate`, {
      prompt,
      modelOverride,
    });
  }

  /** Bulk translation status for the project list page */
  getActiveTranslations(): Observable<Record<string, { isRunning: boolean; isPaused: boolean; done: number; total: number; percent: number }>> {
    return this.http.get<any>(`${this.apiUrl}/translations/active`);
  }

  /** Enqueue TRANSLATE_BATCH jobs for all pending pages */
  startTranslation(projectId: string, model?: string): Observable<{ jobCount: number; message: string }> {
    return this.http.post<any>(`${this.apiUrl}/${projectId}/translate`, { model: model || null });
  }

  /** Snapshot of extraction pipeline state — frontend polls on 1.5s interval */
  getExtractionProgress(projectId: string): Observable<{
    phase: string;
    pagesFound: number;
    pagesRendered: number;
    isActive: boolean;
  }> {
    return this.http.get<any>(`${this.apiUrl}/${projectId}/extract/progress`);
  }

  /** Poll translation job + page progress */
  getTranslationProgress(projectId: string): Observable<{
    active: { total: number; queued: number; running: number; paused: number; isRunning: boolean; isPaused: boolean; isActive: boolean };
    progress: { total: number; done: number; percent: number };
    pages: Page[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/${projectId}/translate/progress`);
  }

  /** Pause all QUEUED translation jobs for the project */
  pauseProject(projectId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${projectId}/pause`, {});
  }

  /** Resume all PAUSED translation jobs for the project */
  resumeProject(projectId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${projectId}/resume`, {});
  }

  /** Cancel all active translation jobs for the project */
  cancelProjectJobs(projectId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${projectId}/cancel-jobs`, {});
  }

  /** Reviewer assignment helpers */
  assignReviewersToPage(pageId: string, reviewerIds: string[]): Observable<Page> {
    return this.http.post<Page>(`/api/v1/pages/${pageId}/reassign`, { reviewerIds });
  }

  removeReviewerFromPage(pageId: string, userId: string): Observable<Page> {
    return this.http.post<Page>(`/api/v1/pages/${pageId}/remove-reviewer`, { reviewerId: userId });
  }

  bulkAssign(pageIds: string[], reviewerId: string): Observable<{ assigned: number }> {
    return this.http.post<{ assigned: number }>('/api/v1/pages/bulk/assign', { pageIds, reviewerId });
  }

  bulkUnassign(pageIds: string[], reviewerId: string): Observable<{ unassigned: number }> {
    return this.http.post<{ unassigned: number }>('/api/v1/pages/bulk/unassign', { pageIds, reviewerId });
  }

  bulkReassign(pageIds: string[], reviewerIds: string[]): Observable<{ reassigned: number }> {
    return this.http.post<{ reassigned: number }>('/api/v1/pages/bulk/reassign', { pageIds, reviewerIds });
  }

  /** Queue AI review for all translated pages in a project */
  reviewProject(projectId: string, modelOverride?: string): Observable<{ jobId: string; message: string }> {
    return this.http.post<any>(`${this.apiUrl}/${projectId}/review`, { modelOverride });
  }

  /** Get job status by ID */
  getJob(jobId: string): Observable<{ id: string; status: string; errorMessage?: string }> {
    return this.http.get<any>(`/api/v1/jobs/${jobId}`);
  }

  /** Run AI review on a single page */
  reviewPage(pageId: string, modelOverride?: string): Observable<any> {
    return this.http.post<any>(`/api/v1/pages/${pageId}/review`, { modelOverride });
  }

  /** List available Gemini models */
  getModels(): Observable<{ name: string; label: string; status: string; retryAt?: string }[]> {
    return this.http.get<any[]>('/api/v1/agents/models');
  }

  /** SSE stream for model status updates */
  modelStatusStream(): Observable<MessageEvent> {
    return new Observable((observer) => {
      const eventSource = new EventSource(this.withToken('/api/v1/agents/models/stream'));
      eventSource.onmessage = (event) => {
        observer.next(event);
      };
      eventSource.onerror = (err) => {
        observer.error(err);
      };
      return () => eventSource.close();
    });
  }

  /** Get errors for a page with segment IDs */
  getPageErrors(pageId: string): Observable<{ segmentId: string; severity: string; message: string }[]> {
    return this.http.get<any[]>(`/api/v1/errors?pageId=${pageId}&status=OPEN`);
  }
}
