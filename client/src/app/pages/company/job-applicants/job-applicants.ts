import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApplicationsApi, type Applicant, type EmployerStatusTarget } from '../../../core/applications.api';
import { JobsApi, type Job } from '../../../core/jobs.api';
import { APPLICATION_STATUS_LABELS, EMPLOYER_TRANSITIONS } from '../../../core/labels';
import { Button, Card, SectionHeader, Tag } from '../../../shared/ui';

@Component({
  selector: 'app-job-applicants',
  imports: [DatePipe, RouterLink, Button, Card, SectionHeader, Tag],
  templateUrl: './job-applicants.html',
  styleUrl: './job-applicants.scss',
})
export class JobApplicants {
  private readonly api = inject(ApplicationsApi);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  protected readonly job = signal<Job | null>(null);
  protected readonly applicants = signal<Applicant[] | null>(null);
  protected readonly failed = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly statusLabels = APPLICATION_STATUS_LABELS;

  constructor() {
    inject(JobsApi).get(this.id).subscribe({ next: (job) => this.job.set(job), error: () => this.failed.set(true) });
    this.api.forJob(this.id).subscribe({ next: (list) => this.applicants.set(list), error: () => this.failed.set(true) });
  }

  protected nextStatuses(applicant: Applicant): EmployerStatusTarget[] {
    return (EMPLOYER_TRANSITIONS[applicant.status] ?? []) as EmployerStatusTarget[];
  }

  protected move(applicant: Applicant, status: EmployerStatusTarget, note: string): void {
    this.error.set(null);
    this.api.updateStatus(applicant.id, status, note.trim() || undefined).subscribe({
      next: (updated) => this.applicants.update((list) => list!.map((a) => (a.id === updated.id ? updated : a))),
      error: (e: HttpErrorResponse) => this.error.set(e.error?.detail ?? 'No se pudo cambiar el estado'),
    });
  }
}
