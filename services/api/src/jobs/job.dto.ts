import type { Decimal } from '@prisma/client/runtime/client';

export interface JobDto {
  id: string;
  title: string;
  description: string;
  company: { id: string; name: string };
  employmentType: string;
  workMode: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  status: string;
  publishedAt: Date | null;
  skills: { id: string; name: string; required: boolean }[];
  applicationsCount: number;
}

// Forma mínima que necesita el mapper; coincide con JOB_INCLUDE en jobs.service.ts
export interface JobRow {
  id: string;
  title: string;
  description: string;
  company: { id: string; name: string };
  employment_type: string;
  work_mode: string;
  location: string | null;
  salary_min: Decimal | null;
  salary_max: Decimal | null;
  salary_currency: string | null;
  status: string;
  published_at: Date | null;
  job_posting_skill: { is_required: boolean; skill: { id: string; name: string } }[];
  _count: { job_application: number };
}

export function toJobDto(row: JobRow): JobDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    company: row.company,
    employmentType: row.employment_type,
    workMode: row.work_mode,
    location: row.location,
    salaryMin: row.salary_min === null ? null : Number(row.salary_min),
    salaryMax: row.salary_max === null ? null : Number(row.salary_max),
    salaryCurrency: row.salary_currency,
    status: row.status,
    publishedAt: row.published_at,
    skills: row.job_posting_skill.map((s) => ({ id: s.skill.id, name: s.skill.name, required: s.is_required })),
    applicationsCount: row._count.job_application,
  };
}
