import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApplicationsApi, type Application } from '../../../core/applications.api';
import { APPLICATION_STATUS_LABELS, TERMINAL_APPLICATION_STATUSES } from '../../../core/labels';
import { Button, SectionHeader, Tag } from '../../../shared/ui';

@Component({
  selector: 'app-my-applications',
  imports: [DatePipe, RouterLink, Button, SectionHeader, Tag],
  templateUrl: './my-applications.html',
  styleUrl: './my-applications.scss',
})
export class MyApplications {
  private readonly api = inject(ApplicationsApi);

  protected readonly applications = signal<Application[] | null>(null);
  protected readonly failed = signal(false);
  protected readonly statusLabels = APPLICATION_STATUS_LABELS;

  constructor() {
    this.api.mine().subscribe({ next: (apps) => this.applications.set(apps), error: () => this.failed.set(true) });
  }

  protected canWithdraw(application: Application): boolean {
    return !TERMINAL_APPLICATION_STATUSES.includes(application.status);
  }

  protected withdraw(application: Application): void {
    this.api.withdraw(application.id).subscribe((updated) => {
      this.applications.update((list) => list!.map((a) => (a.id === updated.id ? updated : a)));
    });
  }
}
