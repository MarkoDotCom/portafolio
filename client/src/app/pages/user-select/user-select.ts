import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { homeFor, userSubtitle } from '../../core/labels';
import { Session } from '../../core/session';
import { UsersApi, type UserRole, type UserSummary } from '../../core/users.api';
import { Button, ProfileCard, SectionHeader, Tag, ThemeToggle } from '../../shared/ui';

const ROLE_LABELS: Record<UserRole, string> = {
  worker: 'Trabajador',
  employer: 'Empleador',
};

@Component({
  selector: 'app-user-select',
  imports: [Button, ProfileCard, SectionHeader, Tag, ThemeToggle],
  templateUrl: './user-select.html',
  styleUrl: './user-select.scss',
})
export class UserSelect {
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  protected readonly apiUrl = environment.apiUrl;
  protected readonly subtitle = userSubtitle;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly users = signal<UserSummary[] | null>(null);
  protected readonly failed = signal(false);

  constructor() {
    inject(UsersApi)
      .list()
      .subscribe({
        next: (users) => this.users.set(users),
        error: () => this.failed.set(true),
      });
  }

  protected enter(user: UserSummary): void {
    this.session.select(user);
    void this.router.navigateByUrl(homeFor(user));
  }
}
