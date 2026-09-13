import { Injectable } from '@nestjs/common';
import type { Decimal } from '@prisma/client/runtime/client';
import { PrismaService } from '../prisma.service.js';

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

export interface NewJobPosting {
  companyId: string;
  createdBy: string;
  title: string;
  description: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
  workMode: 'onsite' | 'hybrid' | 'remote';
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  skills: { skillId: string; required: boolean }[];
}

const INCLUDE = {
  company: { select: { id: true, name: true } },
  job_posting_skill: { select: { is_required: true, skill: { select: { id: true, name: true } } } },
  _count: { select: { job_application: true } },
} as const;

interface Row {
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

function toJob(row: Row): JobDto {
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

@Injectable()
export class JobPostingTable {
  constructor(private readonly prisma: PrismaService) {}

  async findPublished(): Promise<JobDto[]> {
    const rows = await this.prisma.job_posting.findMany({
      where: { status: 'published' },
      include: INCLUDE,
      orderBy: { published_at: 'desc' },
    });
    return rows.map(toJob);
  }

  async findById(id: string): Promise<JobDto | null> {
    const row = await this.prisma.job_posting.findUnique({ where: { id }, include: INCLUDE });
    return row && toJob(row);
  }

  async findByCompany(companyId: string): Promise<JobDto[]> {
    const rows = await this.prisma.job_posting.findMany({
      where: { company_id: companyId },
      include: INCLUDE,
      orderBy: { created_at: 'desc' },
    });
    return rows.map(toJob);
  }

  async create(job: NewJobPosting): Promise<JobDto> {
    const row = await this.prisma.job_posting.create({
      data: {
        company_id: job.companyId,
        created_by: job.createdBy,
        title: job.title,
        description: job.description,
        employment_type: job.employmentType,
        work_mode: job.workMode,
        location: job.location,
        salary_min: job.salaryMin,
        salary_max: job.salaryMax,
        salary_currency: job.salaryCurrency,
        job_posting_skill: { create: job.skills.map((s) => ({ skill_id: s.skillId, is_required: s.required })) },
      },
      include: INCLUDE,
    });
    return toJob(row);
  }

  async updateStatus(id: string, status: 'published' | 'closed'): Promise<JobDto> {
    const row = await this.prisma.job_posting.update({
      where: { id },
      data: { status, ...(status === 'published' ? { published_at: new Date() } : {}) },
      include: INCLUDE,
    });
    return toJob(row);
  }
}
