import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { CurrentUserData } from '../auth/current-user.js';
import { DuplicateApplicationError, JobApplicationTable } from '../../database/tables/job-application.table.js';
import { JobPostingTable } from '../../database/tables/job-posting.table.js';
import { ApplicationsService } from './applications.service.js';

const employer: CurrentUserData = { id: 'u4', fullName: 'Diego', isWorker: false, companies: [{ id: 'c1', role: 'recruiter' }] };
const worker: CurrentUserData = { id: 'u2', fullName: 'Bruno', isWorker: true, companies: [] };

const application = {
  id: 'a1', status: 'applied', coverLetter: null, appliedAt: new Date(),
  job: { id: 'j1', title: 'Frontend', company: { id: 'c1', name: 'Nortech' } },
};

async function setup(applications: object, jobs: object = {}) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      ApplicationsService,
      { provide: JobApplicationTable, useValue: applications },
      { provide: JobPostingTable, useValue: jobs },
    ],
  }).compile();
  return moduleRef.get(ApplicationsService);
}

describe('ApplicationsService', () => {
  it('refuses applying to a job that is not published', async () => {
    const service = await setup({}, { findById: vi.fn().mockResolvedValue({ status: 'draft' }) });
    await expect(service.apply('j1', {}, worker)).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates the application through the table', async () => {
    const create = vi.fn().mockResolvedValue(application);
    const service = await setup({ create }, { findById: vi.fn().mockResolvedValue({ status: 'published' }) });

    await expect(service.apply('j1', { coverLetter: 'Hola' }, worker)).resolves.toBe(application);
    expect(create).toHaveBeenCalledWith('j1', 'u2', 'Hola');
  });

  it('maps a duplicate application to 409', async () => {
    const create = vi.fn().mockRejectedValue(new DuplicateApplicationError());
    const service = await setup({ create }, { findById: vi.fn().mockResolvedValue({ status: 'published' }) });
    await expect(service.apply('j1', {}, worker)).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses withdrawing a terminal application, withdraws otherwise recording the event', async () => {
    const findRef = vi.fn()
      .mockResolvedValueOnce({ id: 'a1', workerId: 'u2', companyId: 'c1', status: 'rejected' })
      .mockResolvedValueOnce({ id: 'a1', workerId: 'u2', companyId: 'c1', status: 'interview' });
    const transition = vi.fn().mockResolvedValue({ ...application, status: 'withdrawn' });
    const service = await setup({ findRef, transition });

    await expect(service.withdraw('a1', worker)).rejects.toBeInstanceOf(ConflictException);
    await service.withdraw('a1', worker);

    expect(transition).toHaveBeenCalledWith('a1', 'interview', 'withdrawn', 'u2', null);
  });

  it('only lets company members change status, and only along valid transitions', async () => {
    const applicant = { ...application, status: 'reviewing', worker: { id: 'u2', fullName: 'Bruno', headline: 'Backend', skills: ['Node.js'] } };
    const service = await setup({
      findRef: vi.fn().mockResolvedValue({ id: 'a1', workerId: 'u2', companyId: 'c1', status: 'applied' }),
      transition: vi.fn().mockResolvedValue(application),
      findApplicant: vi.fn().mockResolvedValue(applicant),
    });

    await expect(service.updateStatus('a1', { status: 'reviewing' }, worker)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.updateStatus('a1', { status: 'offer' }, employer)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.updateStatus('a1', { status: 'reviewing', note: 'Buen perfil' }, employer)).resolves.toBe(applicant);
  });
});
