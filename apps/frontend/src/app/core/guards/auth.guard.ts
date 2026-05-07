import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  if (!auth.hasRefreshToken()) {
    router.navigate(['/login']);
    return false;
  }

  return auth.loadCurrentUser().pipe(
    map(() => true),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    }),
  );
};
