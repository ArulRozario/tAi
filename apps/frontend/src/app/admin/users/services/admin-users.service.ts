import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MASTER' | 'REVIEWER';
  isActive: boolean;
  sessionCount?: number;
  lastActiveAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UserDetail extends User {
  updatedAt: string;
  activeSessions: {
    id: string;
    createdAt: string;
    expiresAt: string;
  }[];
}

export interface ListUsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string | null;
  isActive?: boolean | null;
  sortBy?: 'name' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);

  private readonly API_URL = '/api/v1/users';

  listUsers(params: ListUsersParams = {}): Observable<ListUsersResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.isActive !== null && params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive.toString());
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);

    return this.http.get<ListUsersResponse>(this.API_URL, { params: httpParams });
  }

  getUser(id: string): Observable<UserDetail> {
    return this.http.get<any>(`${this.API_URL}/${id}`).pipe(
      map(u => ({ ...u, activeSessions: u.refreshTokens ?? [] }))
    );
  }

  createUser(data: { name: string; email: string; role: string }): Observable<{ id: string; email: string; name: string; role: string; isActive: boolean; mustChangePassword: boolean; createdAt: string; temporaryPassword: string }> {
    return this.http.post<any>(`${this.API_URL}`, data).pipe(
      tap((res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'User created',
          detail: `Temporary password: ${res.temporaryPassword} — Share securely with ${res.email}`,
        });
      })
    );
  }

  updateUser(id: string, data: { name?: string; role?: string; isActive?: boolean }): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/${id}`, data);
  }

  deactivateUser(id: string): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/${id}/deactivate`, {}).pipe(
      tap(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'User deactivated',
          detail: 'The user has been deactivated and logged out.',
        });
      })
    );
  }

  reactivateUser(id: string): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/${id}/reactivate`, {}).pipe(
      tap(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'User reactivated',
          detail: 'The user can now log in.',
        });
      })
    );
  }

  resetPassword(id: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${id}/reset-password`, {}).pipe(
      tap(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Password reset',
          detail: 'A temporary password has been generated. Communicate it securely to the user.',
        });
      })
    );
  }

  revokeUserSession(userId: string, sessionId: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/auth/me/sessions/${sessionId}`, {
      params: { refreshToken: '' },
    });
  }
}