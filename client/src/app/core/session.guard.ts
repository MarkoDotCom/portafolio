import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session } from './session';

export const sessionGuard: CanActivateFn = () =>
  inject(Session).currentUser() ? true : inject(Router).createUrlTree(['/']);
