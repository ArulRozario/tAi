import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Project {
  id: string;
  name: string;
  description?: string;
  sourceLang: string;
  targetLang: string;
  sourceFile?: string;
  totalPages: number;
  status: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name: string; email: string };
  _count?: { pages: number };
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

export interface Page {
  id: string;
  projectId: string;
  pageNumber: number;
  originalText?: string;
  translatedText?: string;
  status: string;
  qualityScore?: number;
  priority: string;
  createdAt: string;
  updatedAt: string;
  assignedReviewer?: { id: string; name: string };
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = '/api';

  // Projects
  getProjects(page = 1, limit = 20): Observable<PaginationResponse<Project>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginationResponse<Project>>(`${this.baseUrl}/projects`, { params });
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/projects/${id}`);
  }

  getProjectStats(id: string): Observable<ProjectStats> {
    return this.http.get<ProjectStats>(`${this.baseUrl}/projects/${id}/stats`);
  }

  createProject(data: { name: string; description?: string; sourceLang?: string; targetLang?: string }): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects`, data);
  }

  updateProject(id: string, data: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/projects/${id}`, data);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}`);
  }

  // Pages
  getProjectPages(projectId: string, page = 1, limit = 50): Observable<PaginationResponse<Page>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginationResponse<Page>>(`${this.baseUrl}/pages/project/${projectId}`, { params });
  }

  getPage(id: string): Observable<Page> {
    return this.http.get<Page>(`${this.baseUrl}/pages/${id}`);
  }

  getReviewQueue(reviewerId?: string, priority?: string, limit = 20): Observable<Page[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (reviewerId) params = params.set('reviewerId', reviewerId);
    if (priority) params = params.set('priority', priority);
    return this.http.get<Page[]>(`${this.baseUrl}/pages/queue`, { params });
  }
}