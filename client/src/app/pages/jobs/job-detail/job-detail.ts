import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApplicationsApi, type Application } from '../../../core/applications.api';
import { JobsApi, type Job } from '../../../core/jobs.api';
import { APPLICATION_STATUS_LABELS, EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS, formatSalary } from '../../../core/labels';
import { Button, Card, SectionHeader, Tag } from '../../../shared/ui';

@Component({
  selector: 'app-job-detail',
  imports: [FormsModule, RouterLink, Button, Card, SectionHeader, Tag],
  templateUrl: './job-detail.html',
  styleUrl: './job-detail.scss',
})
export class JobDetail {
  private readonly applications = inject(ApplicationsApi);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  protected readonly job = signal<Job | null>(null);
  protected readonly application = signal<Application | null>(null); // mi postulación a esta oferta, si existe
  protected readonly failed = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sending = signal(false);
  protected readonly coverLetter = signal('');

  protected readonly typeLabels = EMPLOYMENT_TYPE_LABELS;
  protected readonly modeLabels = WORK_MODE_LABELS;
  protected readonly statusLabels = APPLICATION_STATUS_LABELS;
  protected readonly salary = formatSalary;

  constructor() {
    inject(JobsApi)
      .get(this.id)
      .subscribe({ next: (job) => this.job.set(job), error: () => this.failed.set(true) });
    this.applications.mine().subscribe((apps) => this.application.set(apps.find((a) => a.job.id === this.id) ?? null));
  }

  protected apply(): void {
    this.sending.set(true);
    this.error.set(null);
    this.applications.apply(this.id, this.coverLetter().trim() || undefined).subscribe({
      next: (application) => {
        this.application.set(application);
        this.sending.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(e.error?.detail ?? 'No se pudo enviar la postulación');
        this.sending.set(false);
      },
    });
  }
}
