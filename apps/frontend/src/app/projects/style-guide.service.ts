import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StyleGuide {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  segmentUnit: string;
  createdAt: string;
  updatedAt: string;
  currentVersion?: {
    id: string;
    version: string;
    createdAt: string;
    content?: string;
  };
  _count?: {
    projects: number;
  };
}

export interface StyleGuideVersion {
  id: string;
  version: string;
  content: string;
  note?: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class StyleGuideService {
  private apiUrl = '/api/v1/style-guides';

  constructor(private http: HttpClient) {}

  getStyleGuides(q?: string, limit?: number): Observable<StyleGuide[]> {
    let url = this.apiUrl;
    const params: string[] = [];
    if (q) params.push(`q=${q}`);
    if (limit) params.push(`limit=${limit}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    return this.http.get<StyleGuide[]>(url);
  }

  getStyleGuide(id: string): Observable<StyleGuide> {
    return this.http.get<StyleGuide>(`${this.apiUrl}/${id}`);
  }

  getStyleGuideVersions(id: string): Observable<StyleGuideVersion[]> {
    return this.http.get<StyleGuideVersion[]>(`${this.apiUrl}/${id}/versions`);
  }

  createStyleGuide(dto: { name: string; description?: string; icon?: string; color?: string; segmentUnit?: string; content?: string }): Observable<StyleGuide> {
    return this.http.post<StyleGuide>(this.apiUrl, dto);
  }

  createStyleGuideVersion(id: string, dto: { content: string; note?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/versions`, dto);
  }
}
