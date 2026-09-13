import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JobsApi, type Job } from '../../../core/jobs.api';
import { EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS, formatSalary } from '../../../core/labels';
import { Card, SectionHeader, Tag } from '../../../shared/ui';

@Component({
  selector: 'app-job-list',
  imports: [RouterLink, Card, SectionHeader, Tag],
  templateUrl: './job-list.html',
  styleUrl: './job-list.scss',
})
export class JobList {
  protected readonly jobs = signal<Job[] | null>(null);
  protected readonly failed = signal(false);
  protected readonly typeLabels = EMPLOYMENT_TYPE_LABELS;
  protected readonly modeLabels = WORK_MODE_LABELS;
  protected readonly salary = formatSalary;

  constructor() {
    inject(JobsApi)
      .listPublished()
      .subscribe({ next: (jobs) => this.jobs.set(jobs), error: () => this.failed.set(true) });
  }
}
