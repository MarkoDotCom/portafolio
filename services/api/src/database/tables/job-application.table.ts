import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

export type ApplicationStatus = 'applied' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'withdrawn';

// Vista del trabajador: sus postulaciones
export interface ApplicationDto {
  id: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  appliedAt: Date;
  job: { id: string; title: string; company: { id: string; name: string } };
}

// Vista del empleador: postulantes de una oferta
export interface ApplicantDto {
  id: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  appliedAt: Date;
  worker: { id: string; fullName: string; headline: string | null; skills: string[] };
}

// Lo justo para decidir permisos y transiciones
export interface ApplicationRef {
  id: string;
  status: ApplicationStatus;
  workerId: string;
  companyId: string;
}

export class DuplicateApplicationError extends Error {
  constructor() {
    super('El trabajador ya postuló a esta oferta');
  }
}

const UNIQUE_VIOLATION = 'P2002';

const APPLICATION_INCLUDE = {
  job_posting: { select: { id: true, title: true, company: { select: { id: true, name: true } } } },
} as const;

const APPLICANT_INCLUDE = {
  worker_profile: {
    select: {
      user_id: true,
      headline: true,
      app_user: { select: { full_name: true } },
      worker_skill: { select: { skill: { select: { name: true } } }, orderBy: { sort_order: 'asc' } },
    },
  },
} as const;

interface ApplicationRow {
  id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  applied_at: Date;
  job_posting: { id: string; title: string; company: { id: string; name: string } };
}

interface ApplicantRow {
  id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  applied_at: Date;
  worker_profile: {
    user_id: string;
    headline: string | null;
    app_user: { full_name: string };
    worker_skill: { skill: { name: string } }[];
  };
}

function toApplication(row: ApplicationRow): ApplicationDto {
  return { id: row.id, status: row.status, coverLetter: row.cover_letter, appliedAt: row.applied_at, job: row.job_posting };
}

function toApplicant(row: ApplicantRow): ApplicantDto {
  return {
    id: row.id,
    status: row.status,
    coverLetter: row.cover_letter,
    appliedAt: row.applied_at,
    worker: {
      id: row.worker_profile.user_id,
      fullName: row.worker_profile.app_user.full_name,
      headline: row.worker_profile.headline,
      skills: row.worker_profile.worker_skill.map((s) => s.skill.name),
    },
  };
}

@Injectable()
export class JobApplicationTable {
  constructor(private readonly prisma: PrismaService) {}

  /** Crea la postulación y su evento inicial en una transacción. Lanza DuplicateApplicationError si ya existe. */
  async create(jobId: string, workerId: string, coverLetter: string | null): Promise<ApplicationDto> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.job_application.create({
          data: { job_posting_id: jobId, worker_id: workerId, cover_letter: coverLetter },
          include: APPLICATION_INCLUDE,
        });
        await tx.job_application_event.create({
          data: { application_id: row.id, changed_by: workerId, from_status: null, to_status: 'applied' },
        });
        return toApplication(row);
      });
    } catch (e) {
      if ((e as { code?: string }).code === UNIQUE_VIOLATION) throw new DuplicateApplicationError();
      throw e;
    }
  }

  async findRef(id: string): Promise<ApplicationRef | null> {
    const row = await this.prisma.job_application.findUnique({
      where: { id },
      select: { id: true, status: true, worker_id: true, job_posting: { select: { company_id: true } } },
    });
    return row && { id: row.id, status: row.status, workerId: row.worker_id, companyId: row.job_posting.company_id };
  }

  async findByWorker(workerId: string): Promise<ApplicationDto[]> {
    const rows = await this.prisma.job_application.findMany({
      where: { worker_id: workerId },
      include: APPLICATION_INCLUDE,
      orderBy: { applied_at: 'desc' },
    });
    return rows.map(toApplication);
  }

  async findApplicantsByJob(jobId: string): Promise<ApplicantDto[]> {
    const rows = await this.prisma.job_application.findMany({
      where: { job_posting_id: jobId },
      include: APPLICANT_INCLUDE,
      orderBy: { applied_at: 'asc' },
    });
    return rows.map(toApplicant);
  }

  async findApplicant(id: string): Promise<ApplicantDto> {
    const row = await this.prisma.job_application.findUniqueOrThrow({ where: { id }, include: APPLICANT_INCLUDE });
    return toApplicant(row);
  }

  /** Cambia el estado y deja el evento en el historial, en una sola transacción. */
  transition(id: string, from: ApplicationStatus, to: ApplicationStatus, changedBy: string, note: string | null): Promise<ApplicationDto> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.job_application.update({ where: { id }, data: { status: to }, include: APPLICATION_INCLUDE });
      await tx.job_application_event.create({
        data: { application_id: id, changed_by: changedBy, from_status: from, to_status: to, note },
      });
      return toApplication(row);
    });
  }
}
