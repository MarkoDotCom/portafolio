import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { assertMember, type CurrentUserData } from '../auth/current-user.js';
import {
  DuplicateApplicationError,
  JobApplicationTable,
  type ApplicantDto,
  type ApplicationDto,
  type ApplicationStatus,
} from '../database/tables/job-application.table.js';
import { JobPostingTable } from '../database/tables/job-posting.table.js';
import type { CreateApplicationDto } from './dto/create-application.dto.js';
import type { UpdateApplicationStatusDto } from './dto/update-application-status.dto.js';

// Transiciones que puede hacer el empleador. offer, rejected y withdrawn son terminales.
const EMPLOYER_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  applied: ['reviewing', 'rejected'],
  reviewing: ['interview', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: [],
  rejected: [],
  withdrawn: [],
};

const TERMINAL = new Set<ApplicationStatus>(['offer', 'rejected', 'withdrawn']);

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applications: JobApplicationTable,
    private readonly jobs: JobPostingTable,
  ) {}

  async apply(jobId: string, dto: CreateApplicationDto, user: CurrentUserData): Promise<ApplicationDto> {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundException('Oferta no encontrada');
    if (job.status !== 'published') throw new ConflictException('La oferta no está publicada');

    try {
      return await this.applications.create(jobId, user.id, dto.coverLetter ?? null);
    } catch (e) {
      if (e instanceof DuplicateApplicationError) throw new ConflictException('Ya postulaste a esta oferta');
      throw e;
    }
  }

  listMine(user: CurrentUserData): Promise<ApplicationDto[]> {
    return this.applications.findByWorker(user.id);
  }

  async withdraw(id: string, user: CurrentUserData): Promise<ApplicationDto> {
    const app = await this.applications.findRef(id);
    if (!app || app.workerId !== user.id) throw new NotFoundException('Postulación no encontrada');
    if (TERMINAL.has(app.status)) throw new ConflictException(`No se puede retirar una postulación en estado ${app.status}`);

    return this.applications.transition(id, app.status, 'withdrawn', user.id, null);
  }

  async listForJob(jobId: string, user: CurrentUserData): Promise<ApplicantDto[]> {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundException('Oferta no encontrada');
    assertMember(user, job.company.id);
    return this.applications.findApplicantsByJob(jobId);
  }

  async updateStatus(id: string, dto: UpdateApplicationStatusDto, user: CurrentUserData): Promise<ApplicantDto> {
    const app = await this.applications.findRef(id);
    if (!app) throw new NotFoundException('Postulación no encontrada');
    assertMember(user, app.companyId);
    if (!EMPLOYER_TRANSITIONS[app.status].includes(dto.status)) {
      throw new ConflictException(`No se puede pasar de ${app.status} a ${dto.status}`);
    }

    await this.applications.transition(id, app.status, dto.status, user.id, dto.note ?? null);
    return this.applications.findApplicant(id);
  }
}
