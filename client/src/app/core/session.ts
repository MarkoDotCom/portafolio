import { Injectable, signal } from '@angular/core';
import type { UserSummary } from './users.api';

// Usuario "logueado". Sustituye a la autenticación mientras no exista.
@Injectable({ providedIn: 'root' })
export class Session {
  readonly currentUser = signal<UserSummary | null>(null);

  select(user: UserSummary): void {
    this.currentUser.set(user);
  }

  clear(): void {
    this.currentUser.set(null);
  }
}
