import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const required: string[] = route.data['roles'] ?? [];

  if (required.length === 0 || auth.hasRole(...required)) return true;

  router.navigate(['/dashboard']);
  return false;
};
