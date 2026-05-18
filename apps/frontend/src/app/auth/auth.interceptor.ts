import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, of } from 'rxjs';
import { AuthService } from './auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip auth header for truly public auth endpoints only
  const publicPaths = ['/auth/login', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];
  const isPublicAuthEndpoint = publicPaths.some(p => req.url.includes(p));

  if (isPublicAuthEndpoint) {
    return next(req);
  }

  const token = authService.getAccessToken();
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized
      if (error.status === 401 && !isPublicAuthEndpoint) {
        // No refresh token? Logout immediately.
        if (!authService.getRefreshToken()) {
          authService.logout();
          return throwError(() => error);
        }

        // Already trying to refresh? Just logout — don't queue multiple refresh attempts.
        if (isRefreshing) {
          authService.logout();
          return throwError(() => error);
        }

        isRefreshing = true;

        return authService.refreshToken().pipe(
          switchMap((res) => {
            isRefreshing = false;
            // Retry the original request with the new access token
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${res.accessToken}`,
              },
            });
            return next(retryReq);
          }),
          catchError((refreshErr) => {
            isRefreshing = false;
            // Refresh failed — token is truly invalid. Force logout.
            authService.logout();
            return throwError(() => refreshErr);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
