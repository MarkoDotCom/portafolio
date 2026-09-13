import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { homeFor } from '../../core/labels';
import { Session } from '../../core/session';
import { ThemeToggle } from '../../shared/ui';

// Layout de las páginas con sesión: header con navegación por rol y el outlet
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggle],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly session = inject(Session);
  protected readonly user = this.session.currentUser;
  protected readonly isWorker = computed(() => this.user()?.roles.includes('worker') ?? false);
  protected readonly isEmployer = computed(() => this.user()?.roles.includes('employer') ?? false);
  protected readonly home = computed(() => {
    const user = this.user();
    return user ? homeFor(user) : '/';
  });
}
