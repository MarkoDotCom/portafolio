import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { assertMember, type CurrentUserData } from '../auth/current-user.js';
import { PrismaService } from '../database/prisma.service.js';
import { toApplicantDto, toApplicationDto, type ApplicantDto, type ApplicationDto } from './application.dto.js';
import type { CreateApplicationDto } from './dto/create-application.dto.js';
import type { UpdateApplicationStatusDto } from './dto/update-application-status.dto.js';

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

// Transiciones que puede hacer el empleador. offer, rejected y withdrawn son terminales.
const EMPLOYER_TRANSITIONS: Record<string, readonly string[]> = {
  applied: ['reviewing', 'rejected'],
  reviewing: ['interview', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: [],
  rejected: [],
  withdrawn: [],
};

const TERMINAL = new Set(['offer', 'rejected', 'withdrawn']);

const UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(jobId: string, dto: CreateApplicationDto, user: CurrentUserData): Promise<ApplicationDto> {
    const job = await this.prisma.job_posting.findUnique({ where: { id: jobId }, select: { status: true } });
    if (!job) throw new NotFoundException('Oferta no encontrada');
    if (job.status !== 'published') throw new ConflictException('La oferta no está publicada');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const row = await tx.job_application.create({
          data: { job_posting_id: jobId, worker_id: user.id, cover_letter: dto.coverLetter ?? null },
          include: APPLICATION_INCLUDE,
        });
        await tx.job_application_event.create({
          data: { application_id: row.id, changed_by: user.id, from_status: null, to_status: 'applied' },
        });
        return toApplicationDto(row);
      });
    } catch (e) {
      if ((e as { code?: string }).code === UNIQUE_VIOLATION) throw new ConflictException('Ya postulaste a esta oferta');
      throw e;
    }
  }

  async listMine(user: CurrentUserData): Promise<ApplicationDto[]> {
    const rows = await this.prisma.job_application.findMany({
      where: { worker_id: user.id },
      include: APPLICATION_INCLUDE,
      orderBy: { applied_at: 'desc' },
    });
    return rows.map(toApplicationDto);
  }

  async withdraw(id: string, user: CurrentUserData): Promise<ApplicationDto> {
    const app = await this.prisma.job_application.findUnique({ where: { id }, select: { worker_id: true, status: true } });
    if (!app || app.worker_id !== user.id) throw new NotFoundException('Postulación no encontrada');
    if (TERMINAL.has(app.status)) throw new ConflictException(`No se puede retirar una postulación en estado ${app.status}`);

    return this.transition(id, app.status, 'withdrawn', user.id, null);
  }

  async listForJob(jobId: string, user: CurrentUserData): Promise<ApplicantDto[]> {
    const job = await this.prisma.job_posting.findUnique({ where: { id: jobId }, select: { company_id: true } });
    if (!job) throw new NotFoundException('Oferta no encontrada');
    assertMember(user, job.company_id);

    const rows = await this.prisma.job_application.findMany({
      where: { job_posting_id: jobId },
      include: APPLICANT_INCLUDE,
      orderBy: { applied_at: 'asc' },
    });
    return rows.map(toApplicantDto);
  }

  async updateStatus(id: string, dto: UpdateApplicationStatusDto, user: CurrentUserData): Promise<ApplicantDto> {
    const app = await this.prisma.job_application.findUnique({
      where: { id },
      select: { status: true, job_posting: { select: { company_id: true } } },
    });
    if (!app) throw new NotFoundException('Postulación no encontrada');
    assertMember(user, app.job_posting.company_id);
    if (!EMPLOYER_TRANSITIONS[app.status]?.includes(dto.status)) {
      throw new ConflictException(`No se puede pasar de ${app.status} a ${dto.status}`);
    }

    await this.transition(id, app.status, dto.status, user.id, dto.note ?? null);
    const row = await this.prisma.job_application.findUniqueOrThrow({ where: { id }, include: APPLICANT_INCLUDE });
    return toApplicantDto(row);
  }

  // Cambia el estado y deja el evento en el historial, en una sola transacción
  private transition(id: string, from: string, to: string, changedBy: string, note: string | null): Promise<ApplicationDto> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.job_application.update({
        where: { id },
        data: { status: to as never },
        include: APPLICATION_INCLUDE,
      });
      await tx.job_application_event.create({
        data: { application_id: id, changed_by: changedBy, from_status: from as never, to_status: to as never, note },
      });
      return toApplicationDto(row);
    });
  }
}
