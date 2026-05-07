import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, throwError } from 'rxjs';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'REVIEWER' | 'MASTER' | 'ADMIN';
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API = '/api/v1';
  private readonly REFRESH_KEY = 'tai_refresh_token';

  private _accessToken: string | null = null;
  private _user = signal<AuthUser | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  get accessToken(): string | null {
    return this._accessToken;
  }

  login(email: string, password: string, rememberMe = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API}/auth/login`, { email, password, rememberMe }).pipe(
      tap((res) => {
        this._accessToken = res.accessToken;
        this._user.set(res.user);
        localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
      }),
    );
  }

  refresh(): Observable<RefreshResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    if (!refreshToken) return throwError(() => new Error('No refresh token'));

    return this.http.post<RefreshResponse>(`${this.API}/auth/refresh`, { refreshToken }).pipe(
      tap((res) => {
        this._accessToken = res.accessToken;
        localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
      }),
    );
  }

  logout(): void {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    if (refreshToken) {
      this.http.post(`${this.API}/auth/logout`, { refreshToken }).subscribe({ error: () => {} });
    }
    this._accessToken = null;
    this._user.set(null);
    localStorage.removeItem(this.REFRESH_KEY);
    this.router.navigate(['/login']);
  }

  loadCurrentUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.API}/auth/me`).pipe(
      tap((user) => this._user.set(user)),
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.API}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.API}/auth/reset-password`, { token, newPassword });
  }

  hasRole(...roles: string[]): boolean {
    const user = this._user();
    if (!user) return false;
    return roles.includes(user.role);
  }

  hasRefreshToken(): boolean {
    return !!localStorage.getItem(this.REFRESH_KEY);
  }
}
