import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { CurrentUserData } from '../auth/current-user.js';
import { PrismaService } from '../database/prisma.service.js';
import { JobsService } from './jobs.service.js';

const employer: CurrentUserData = { id: 'u4', fullName: 'Diego', isWorker: false, companies: [{ id: 'c1', role: 'recruiter' }] };
const worker: CurrentUserData = { id: 'u2', fullName: 'Bruno', isWorker: true, companies: [] };

const draft = {
  id: 'j1', company_id: 'c1', title: 'Frontend', description: 'Descripción larga', company: { id: 'c1', name: 'Nortech' },
  employment_type: 'full_time', work_mode: 'remote', location: null, salary_min: null, salary_max: null, salary_currency: null,
  status: 'draft', published_at: null, job_posting_skill: [], _count: { job_application: 0 },
};

const baseDto = { companyId: 'c1', title: 'Frontend', description: 'Descripción larga', employmentType: 'full_time' as const, workMode: 'remote' as const, skills: [] };

async function setup(prisma: object) {
  const moduleRef = await Test.createTestingModule({
    providers: [JobsService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(JobsService);
}

describe('JobsService', () => {
  it('rejects creating a job for a company the user is not member of', async () => {
    const service = await setup({});
    await expect(service.create({ ...baseDto, companyId: 'other' }, employer)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a salary range without currency or with max < min', async () => {
    const service = await setup({ skill: { count: vi.fn().mockResolvedValue(0) } });
    await expect(service.create({ ...baseDto, salaryMin: 100 }, employer)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create({ ...baseDto, salaryMin: 200, salaryMax: 100, salaryCurrency: 'CLP' }, employer))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a draft with its skills', async () => {
    const create = vi.fn().mockResolvedValue(draft);
    const service = await setup({ skill: { count: vi.fn().mockResolvedValue(1) }, job_posting: { create } });

    const result = await service.create({ ...baseDto, salaryMin: 100, salaryMax: 200, salaryCurrency: 'clp', skills: [{ skillId: 's1', required: true }] }, employer);

    expect(create.mock.calls[0][0].data).toMatchObject({
      company_id: 'c1', created_by: 'u4', salary_currency: 'CLP',
      job_posting_skill: { create: [{ skill_id: 's1', is_required: true }] },
    });
    expect(result).toMatchObject({ id: 'j1', status: 'draft', company: { name: 'Nortech' }, applicationsCount: 0 });
  });

  it('publishes a draft setting published_at, but refuses closing it', async () => {
    const update = vi.fn().mockResolvedValue({ ...draft, status: 'published', published_at: new Date() });
    const service = await setup({ job_posting: { findUnique: vi.fn().mockResolvedValue({ company_id: 'c1', status: 'draft' }), update } });

    await expect(service.updateStatus('j1', { status: 'closed' }, employer)).rejects.toBeInstanceOf(ConflictException);
    const result = await service.updateStatus('j1', { status: 'published' }, employer);

    expect(update.mock.calls[0][0].data).toMatchObject({ status: 'published', published_at: expect.any(Date) });
    expect(result.status).toBe('published');
  });

  it('hides drafts from users outside the company', async () => {
    const service = await setup({ job_posting: { findUnique: vi.fn().mockResolvedValue(draft) } });
    await expect(service.findOne('j1', worker)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.findOne('j1', employer)).resolves.toMatchObject({ id: 'j1' });
  });
});
