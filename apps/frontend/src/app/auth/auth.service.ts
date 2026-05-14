import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { faro } from '@grafana/faro-web-sdk';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MASTER' | 'REVIEWER';
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private messageService = inject(MessageService);

  private readonly API_URL = '/api/v1/auth';
  private readonly TOKEN_KEY = 'tai_access_token';
  private readonly REFRESH_KEY = 'tai_refresh_token';
  private readonly USER_KEY = 'tai_user';

  private currentUser$ = new BehaviorSubject<User | null>(this.loadUser());
  public user$ = this.currentUser$.asObservable();

  private isRefreshing = false;

  /** Get the current access token */
  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Get the current refresh token */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  /** Get the current user snapshot */
  getCurrentUser(): User | null {
    return this.currentUser$.value;
  }

  /** Check if user is authenticated */
  isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.getCurrentUser();
  }

  /** Check if user has a specific role */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  /** Check if user has any of the given roles */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  /** Login with email and password */
  login(email: string, password: string, rememberMe = false): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_URL}/login`, { email, password, rememberMe })
      .pipe(
        tap((res) => {
          this.setSession(res);
          this.currentUser$.next(res.user);
          faro.api?.setUser({ id: res.user.id, email: res.user.email, attributes: { role: res.user.role } });
          this.messageService.add({
            severity: 'success',
            summary: 'Welcome back',
            detail: `Signed in as ${res.user.name}`,
          });
        }),
        catchError((err) => {
          const msg = err.error?.message || 'Invalid email or password';
          this.messageService.add({
            severity: 'error',
            summary: 'Login failed',
            detail: msg,
          });
          return throwError(() => err);
        })
      );
  }

  /** Refresh the access token */
  refreshToken(): Observable<RefreshResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<RefreshResponse>(`${this.API_URL}/refresh`, { refreshToken })
      .pipe(
        tap((res) => {
          this.setTokens(res.accessToken, res.refreshToken);
        }),
        catchError((err) => {
          this.logout();
          return throwError(() => err);
        })
      );
  }

  /** Logout the current user */
  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      // Best-effort server-side logout
      this.http.post(`${this.API_URL}/logout`, { refreshToken }).subscribe({
        error: () => {},
      });
    }

    this.clearSession();
    this.currentUser$.next(null);
    faro.api?.resetUser();
    this.router.navigate(['/login']);
  }

  /** Fetch current user profile */
  fetchMe(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`).pipe(
      tap((user) => {
        this.currentUser$.next(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      })
    );
  }

  /** Initialize auth state on app startup */
  initAuth(): Observable<User | null> {
    const token = this.getAccessToken();
    if (!token) {
      return of(null);
    }
    return this.fetchMe().pipe(
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  /** Forgot password */
  forgotPassword(email: string): Observable<void> {
    return this.http
      .post<void>(`${this.API_URL}/forgot-password`, { email })
      .pipe(
        tap(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Reset link sent',
            detail: 'Check your email for password reset instructions.',
          });
        }),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Request failed',
            detail: err.error?.message || 'Could not send reset link',
          });
          return throwError(() => err);
        })
      );
  }

  /** Reset password */
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${this.API_URL}/reset-password`, { token, newPassword })
      .pipe(
        tap(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Password updated',
            detail: 'Your password has been reset. Please sign in.',
          });
        }),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Reset failed',
            detail: err.error?.message || 'Could not reset password',
          });
          return throwError(() => err);
        })
      );
  }

  /** Update current user profile */
  updateProfile(data: { name?: string; email?: string }): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/me`, data).pipe(
      tap((user) => {
        this.currentUser$.next(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      })
    );
  }

  /** Change password */
  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.API_URL}/me/change-password`, {
        currentPassword,
        newPassword,
      })
      .pipe(
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Password change failed',
            detail: err.error?.message || 'Could not change password',
          });
          return throwError(() => err);
        })
      );
  }

  /** Get active sessions */
  getSessions(params?: { page?: number; limit?: number }): Observable<{
    sessions: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const refreshToken = this.getRefreshToken();
    const queryParams: any = params ? { ...params } : {};
    if (refreshToken) {
      queryParams['refreshToken'] = refreshToken;
    }
    return this.http.get<any>(`${this.API_URL}/me/sessions`, { params: queryParams });
  }

  /** Revoke a session */
  revokeSession(sessionId: string): Observable<void> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .delete<void>(`${this.API_URL}/me/sessions/${sessionId}`, {
        params: { refreshToken: refreshToken || '' },
      })
      .pipe(
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: err.error?.message || 'Could not revoke session',
          });
          return throwError(() => err);
        })
      );
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private setSession(res: LoginResponse): void {
    this.setTokens(res.accessToken, res.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_KEY, refreshToken);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
