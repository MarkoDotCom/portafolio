import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { assertMember, type CurrentUserData } from '../auth/current-user.js';
import { JobPostingTable, type JobDto } from '../database/tables/job-posting.table.js';
import { SkillTable } from '../database/tables/skill.table.js';
import type { CreateJobDto } from './dto/create-job.dto.js';
import type { UpdateJobStatusDto } from './dto/update-job-status.dto.js';

// Transiciones que puede hacer el empleador
const JOB_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ['published'],
  published: ['closed'],
  closed: [],
};

@Injectable()
export class JobsService {
  constructor(
    private readonly jobs: JobPostingTable,
    private readonly skills: SkillTable,
  ) {}

  listPublished(): Promise<JobDto[]> {
    return this.jobs.findPublished();
  }

  async findOne(id: string, user: CurrentUserData): Promise<JobDto> {
    const job = await this.jobs.findById(id);
    // Un borrador o una oferta cerrada solo la ven los miembros de la empresa
    const isMember = job !== null && user.companies.some((c) => c.id === job.company.id);
    if (!job || (job.status !== 'published' && !isMember)) throw new NotFoundException('Oferta no encontrada');
    return job;
  }

  listForCompany(companyId: string, user: CurrentUserData): Promise<JobDto[]> {
    assertMember(user, companyId);
    return this.jobs.findByCompany(companyId);
  }

  async create(dto: CreateJobDto, user: CurrentUserData): Promise<JobDto> {
    assertMember(user, dto.companyId);

    const hasSalary = dto.salaryMin !== undefined || dto.salaryMax !== undefined;
    if (hasSalary && !dto.salaryCurrency) throw new BadRequestException('Indica la moneda del salario');
    if (dto.salaryMin !== undefined && dto.salaryMax !== undefined && dto.salaryMax < dto.salaryMin) {
      throw new BadRequestException('El salario máximo debe ser mayor o igual al mínimo');
    }

    const skillIds = [...new Set(dto.skills.map((s) => s.skillId))];
    if (skillIds.length !== dto.skills.length) throw new BadRequestException('Skills repetidas');
    if ((await this.skills.countByIds(skillIds)) !== skillIds.length) throw new BadRequestException('Alguna skill no existe');

    return this.jobs.create({
      companyId: dto.companyId,
      createdBy: user.id,
      title: dto.title,
      description: dto.description,
      employmentType: dto.employmentType,
      workMode: dto.workMode,
      location: dto.location ?? null,
      salaryMin: dto.salaryMin ?? null,
      salaryMax: dto.salaryMax ?? null,
      salaryCurrency: hasSalary ? dto.salaryCurrency!.toUpperCase() : null,
      skills: dto.skills,
    });
  }

  async updateStatus(id: string, dto: UpdateJobStatusDto, user: CurrentUserData): Promise<JobDto> {
    const job = await this.jobs.findById(id);
    if (!job) throw new NotFoundException('Oferta no encontrada');
    assertMember(user, job.company.id);
    if (!JOB_TRANSITIONS[job.status]?.includes(dto.status)) {
      throw new ConflictException(`No se puede pasar de ${job.status} a ${dto.status}`);
    }
    return this.jobs.updateStatus(id, dto.status);
  }
}
