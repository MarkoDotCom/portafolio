import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JobsApi, type Job } from '../../../core/jobs.api';
import { EMPLOYMENT_TYPE_LABELS, JOB_STATUS_LABELS, WORK_MODE_LABELS } from '../../../core/labels';
import { Session } from '../../../core/session';
import { Button, Card, SectionHeader, Tag } from '../../../shared/ui';

@Component({
  selector: 'app-company-jobs',
  imports: [RouterLink, Button, Card, SectionHeader, Tag],
  templateUrl: './company-jobs.html',
  styleUrl: './company-jobs.scss',
})
export class CompanyJobs {
  private readonly api = inject(JobsApi);

  protected readonly companies = inject(Session).currentUser()?.companies ?? [];
  protected readonly companyId = signal(this.companies[0]?.id ?? '');
  protected readonly jobs = signal<Job[] | null>(null);
  protected readonly failed = signal(false);

  protected readonly statusLabels = JOB_STATUS_LABELS;
  protected readonly typeLabels = EMPLOYMENT_TYPE_LABELS;
  protected readonly modeLabels = WORK_MODE_LABELS;

  constructor() {
    this.load();
  }

  protected selectCompany(id: string): void {
    this.companyId.set(id);
    this.load();
  }

  protected setStatus(job: Job, status: 'published' | 'closed'): void {
    this.api.updateStatus(job.id, status).subscribe((updated) => {
      this.jobs.update((list) => list!.map((j) => (j.id === updated.id ? updated : j)));
    });
  }

  private load(): void {
    this.jobs.set(null);
    this.api.listForCompany(this.companyId()).subscribe({
      next: (jobs) => this.jobs.set(jobs),
      error: () => this.failed.set(true),
    });
  }
}
