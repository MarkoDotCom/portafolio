import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JobsApi, type CreateJob, type Skill } from '../../../core/jobs.api';
import { EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS } from '../../../core/labels';
import { Session } from '../../../core/session';
import { Button, SectionHeader } from '../../../shared/ui';

@Component({
  selector: 'app-job-form',
  imports: [ReactiveFormsModule, RouterLink, Button, SectionHeader],
  templateUrl: './job-form.html',
  styleUrl: './job-form.scss',
})
export class JobForm {
  private readonly api = inject(JobsApi);
  private readonly router = inject(Router);

  protected readonly companies = inject(Session).currentUser()?.companies ?? [];
  protected readonly typeOptions = Object.entries(EMPLOYMENT_TYPE_LABELS);
  protected readonly modeOptions = Object.entries(WORK_MODE_LABELS);

  protected readonly skills = signal<Skill[]>([]);
  // skillId → requerida
  protected readonly selectedSkills = signal<Map<string, boolean>>(new Map());
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    companyId: [inject(ActivatedRoute).snapshot.queryParamMap.get('company') ?? this.companies[0]?.id ?? '', Validators.required],
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    employmentType: ['full_time', Validators.required],
    workMode: ['hybrid', Validators.required],
    location: [''],
    salaryMin: [null as number | null],
    salaryMax: [null as number | null],
    salaryCurrency: ['CLP'],
  });

  constructor() {
    this.api.skills().subscribe((skills) => this.skills.set(skills));
  }

  protected toggleSkill(id: string, checked: boolean): void {
    this.selectedSkills.update((map) => {
      const next = new Map(map);
      if (checked) next.set(id, true);
      else next.delete(id);
      return next;
    });
  }

  protected setRequired(id: string, required: boolean): void {
    this.selectedSkills.update((map) => new Map(map).set(id, required));
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const hasSalary = v.salaryMin !== null || v.salaryMax !== null;
    const job: CreateJob = {
      companyId: v.companyId,
      title: v.title,
      description: v.description,
      employmentType: v.employmentType,
      workMode: v.workMode,
      location: v.location || undefined,
      salaryMin: v.salaryMin ?? undefined,
      salaryMax: v.salaryMax ?? undefined,
      salaryCurrency: hasSalary ? v.salaryCurrency : undefined,
      skills: [...this.selectedSkills()].map(([skillId, required]) => ({ skillId, required })),
    };

    this.saving.set(true);
    this.error.set(null);
    this.api.create(job).subscribe({
      next: () => void this.router.navigateByUrl('/empresa/ofertas'),
      error: (e: HttpErrorResponse) => {
        this.error.set(e.error?.message ?? 'No se pudo crear la oferta');
        this.saving.set(false);
      },
    });
  }
}
