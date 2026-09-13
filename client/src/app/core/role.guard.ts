import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { homeFor } from './labels';
import { Session } from './session';
import type { UserRole } from './users.api';

/** Exige que el usuario en sesión tenga el rol; si no, lo manda a su página de inicio. */
export const roleGuard =
  (role: UserRole): CanActivateFn =>
  () => {
    const user = inject(Session).currentUser();
    if (!user) return inject(Router).createUrlTree(['/']);
    return user.roles.includes(role) ? true : inject(Router).createUrlTree([homeFor(user)]);
  };
