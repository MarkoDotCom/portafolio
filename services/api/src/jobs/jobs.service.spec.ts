import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { CurrentUserData } from '../auth/current-user.js';
import { JobPostingTable, type JobDto } from '../database/tables/job-posting.table.js';
import { SkillTable } from '../database/tables/skill.table.js';
import { JobsService } from './jobs.service.js';

const employer: CurrentUserData = { id: 'u4', fullName: 'Diego', isWorker: false, companies: [{ id: 'c1', role: 'recruiter' }] };
const worker: CurrentUserData = { id: 'u2', fullName: 'Bruno', isWorker: true, companies: [] };

const draft: JobDto = {
  id: 'j1', title: 'Frontend', description: 'Descripción larga', company: { id: 'c1', name: 'Nortech' },
  employmentType: 'full_time', workMode: 'remote', location: null, salaryMin: null, salaryMax: null, salaryCurrency: null,
  status: 'draft', publishedAt: null, skills: [], applicationsCount: 0,
};

const baseDto = { companyId: 'c1', title: 'Frontend', description: 'Descripción larga', employmentType: 'full_time' as const, workMode: 'remote' as const, skills: [] };

async function setup(jobs: object, skills: object = {}) {
  const moduleRef = await Test.createTestingModule({
    providers: [JobsService, { provide: JobPostingTable, useValue: jobs }, { provide: SkillTable, useValue: skills }],
  }).compile();
  return moduleRef.get(JobsService);
}

describe('JobsService', () => {
  it('rejects creating a job for a company the user is not member of', async () => {
    const service = await setup({});
    await expect(service.create({ ...baseDto, companyId: 'other' }, employer)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a salary range without currency or with max < min', async () => {
    const service = await setup({}, { countByIds: vi.fn().mockResolvedValue(0) });
    await expect(service.create({ ...baseDto, salaryMin: 100 }, employer)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create({ ...baseDto, salaryMin: 200, salaryMax: 100, salaryCurrency: 'CLP' }, employer))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a draft with its skills', async () => {
    const create = vi.fn().mockResolvedValue(draft);
    const service = await setup({ create }, { countByIds: vi.fn().mockResolvedValue(1) });

    const result = await service.create({ ...baseDto, salaryMin: 100, salaryMax: 200, salaryCurrency: 'clp', skills: [{ skillId: 's1', required: true }] }, employer);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 'c1', createdBy: 'u4', salaryCurrency: 'CLP', skills: [{ skillId: 's1', required: true }],
    }));
    expect(result).toBe(draft);
  });

  it('publishes a draft, but refuses closing it', async () => {
    const updateStatus = vi.fn().mockResolvedValue({ ...draft, status: 'published', publishedAt: new Date() });
    const service = await setup({ findById: vi.fn().mockResolvedValue(draft), updateStatus });

    await expect(service.updateStatus('j1', { status: 'closed' }, employer)).rejects.toBeInstanceOf(ConflictException);
    const result = await service.updateStatus('j1', { status: 'published' }, employer);

    expect(updateStatus).toHaveBeenCalledWith('j1', 'published');
    expect(result.status).toBe('published');
  });

  it('hides drafts from users outside the company', async () => {
    const service = await setup({ findById: vi.fn().mockResolvedValue(draft) });
    await expect(service.findOne('j1', worker)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.findOne('j1', employer)).resolves.toBe(draft);
  });
});
