import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { assertMember, type CurrentUserData } from '../auth/current-user.js';
import { PrismaService } from '../database/prisma.service.js';
import type { CreateJobDto } from './dto/create-job.dto.js';
import type { UpdateJobStatusDto } from './dto/update-job-status.dto.js';
import { toJobDto, type JobDto } from './job.dto.js';

const JOB_INCLUDE = {
  company: { select: { id: true, name: true } },
  job_posting_skill: { select: { is_required: true, skill: { select: { id: true, name: true } } } },
  _count: { select: { job_application: true } },
} as const;

// Transiciones que puede hacer el empleador
const JOB_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ['published'],
  published: ['closed'],
  closed: [],
};

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(): Promise<JobDto[]> {
    const rows = await this.prisma.job_posting.findMany({
      where: { status: 'published' },
      include: JOB_INCLUDE,
      orderBy: { published_at: 'desc' },
    });
    return rows.map(toJobDto);
  }

  async findOne(id: string, user: CurrentUserData): Promise<JobDto> {
    const row = await this.prisma.job_posting.findUnique({ where: { id }, include: JOB_INCLUDE });
    // Un borrador o una oferta cerrada solo la ven los miembros de la empresa
    const isMember = row !== null && user.companies.some((c) => c.id === row.company_id);
    if (!row || (row.status !== 'published' && !isMember)) throw new NotFoundException('Oferta no encontrada');
    return toJobDto(row);
  }

  async listForCompany(companyId: string, user: CurrentUserData): Promise<JobDto[]> {
    assertMember(user, companyId);
    const rows = await this.prisma.job_posting.findMany({
      where: { company_id: companyId },
      include: JOB_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
    return rows.map(toJobDto);
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
    const found = await this.prisma.skill.count({ where: { id: { in: skillIds } } });
    if (found !== skillIds.length) throw new BadRequestException('Alguna skill no existe');

    const row = await this.prisma.job_posting.create({
      data: {
        company_id: dto.companyId,
        created_by: user.id,
        title: dto.title,
        description: dto.description,
        employment_type: dto.employmentType,
        work_mode: dto.workMode,
        location: dto.location ?? null,
        salary_min: dto.salaryMin ?? null,
        salary_max: dto.salaryMax ?? null,
        salary_currency: hasSalary ? dto.salaryCurrency!.toUpperCase() : null,
        job_posting_skill: { create: dto.skills.map((s) => ({ skill_id: s.skillId, is_required: s.required })) },
      },
      include: JOB_INCLUDE,
    });
    return toJobDto(row);
  }

  async updateStatus(id: string, dto: UpdateJobStatusDto, user: CurrentUserData): Promise<JobDto> {
    const job = await this.prisma.job_posting.findUnique({ where: { id }, select: { company_id: true, status: true } });
    if (!job) throw new NotFoundException('Oferta no encontrada');
    assertMember(user, job.company_id);
    if (!JOB_TRANSITIONS[job.status]?.includes(dto.status)) {
      throw new ConflictException(`No se puede pasar de ${job.status} a ${dto.status}`);
    }

    const row = await this.prisma.job_posting.update({
      where: { id },
      data: { status: dto.status, ...(dto.status === 'published' ? { published_at: new Date() } : {}) },
      include: JOB_INCLUDE,
    });
    return toJobDto(row);
  }
}
