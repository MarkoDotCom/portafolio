import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Session } from './session';

// Identidad provisional: la API reconoce al usuario por la cabecera x-user-id
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const user = inject(Session).currentUser();
  return next(user ? req.clone({ setHeaders: { 'x-user-id': user.id } }) : req);
};
