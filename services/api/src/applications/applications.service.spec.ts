import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { CurrentUserData } from '../auth/current-user.js';
import { PrismaService } from '../database/prisma.service.js';
import { ApplicationsService } from './applications.service.js';

const employer: CurrentUserData = { id: 'u4', fullName: 'Diego', isWorker: false, companies: [{ id: 'c1', role: 'recruiter' }] };
const worker: CurrentUserData = { id: 'u2', fullName: 'Bruno', isWorker: true, companies: [] };

const applicationRow = {
  id: 'a1', status: 'applied', cover_letter: null, applied_at: new Date(),
  job_posting: { id: 'j1', title: 'Frontend', company: { id: 'c1', name: 'Nortech' } },
};

function prismaMock(overrides: Record<string, unknown> = {}) {
  const tx = {
    job_application: { create: vi.fn().mockResolvedValue(applicationRow), update: vi.fn().mockResolvedValue(applicationRow) },
    job_application_event: { create: vi.fn().mockResolvedValue({}) },
  };
  return {
    tx,
    prisma: { $transaction: vi.fn((fn: (t: typeof tx) => unknown) => fn(tx)), ...overrides },
  };
}

async function setup(prisma: object) {
  const moduleRef = await Test.createTestingModule({
    providers: [ApplicationsService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  return moduleRef.get(ApplicationsService);
}

describe('ApplicationsService', () => {
  it('refuses applying to a job that is not published', async () => {
    const { prisma } = prismaMock({ job_posting: { findUnique: vi.fn().mockResolvedValue({ status: 'draft' }) } });
    const service = await setup(prisma);
    await expect(service.apply('j1', {}, worker)).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates the application and its applied event in one transaction', async () => {
    const { prisma, tx } = prismaMock({ job_posting: { findUnique: vi.fn().mockResolvedValue({ status: 'published' }) } });
    const service = await setup(prisma);

    const result = await service.apply('j1', { coverLetter: 'Hola' }, worker);

    expect(tx.job_application.create.mock.calls[0][0].data).toEqual({ job_posting_id: 'j1', worker_id: 'u2', cover_letter: 'Hola' });
    expect(tx.job_application_event.create.mock.calls[0][0].data).toMatchObject({ application_id: 'a1', changed_by: 'u2', from_status: null, to_status: 'applied' });
    expect(result).toMatchObject({ id: 'a1', job: { title: 'Frontend' } });
  });

  it('maps a duplicate application to 409', async () => {
    const { prisma, tx } = prismaMock({ job_posting: { findUnique: vi.fn().mockResolvedValue({ status: 'published' }) } });
    tx.job_application.create.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    const service = await setup(prisma);
    await expect(service.apply('j1', {}, worker)).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses withdrawing a terminal application, withdraws otherwise recording the event', async () => {
    const findUnique = vi.fn().mockResolvedValueOnce({ worker_id: 'u2', status: 'rejected' }).mockResolvedValueOnce({ worker_id: 'u2', status: 'interview' });
    const { prisma, tx } = prismaMock({ job_application: { findUnique } });
    const service = await setup(prisma);

    await expect(service.withdraw('a1', worker)).rejects.toBeInstanceOf(ConflictException);
    await service.withdraw('a1', worker);

    expect(tx.job_application.update.mock.calls[0][0].data).toEqual({ status: 'withdrawn' });
    expect(tx.job_application_event.create.mock.calls[0][0].data).toMatchObject({ from_status: 'interview', to_status: 'withdrawn', changed_by: 'u2' });
  });

  it('only lets company members change status, and only along valid transitions', async () => {
    const findUnique = vi.fn().mockResolvedValue({ status: 'applied', job_posting: { company_id: 'c1' } });
    const findUniqueOrThrow = vi.fn().mockResolvedValue({
      ...applicationRow, status: 'reviewing',
      worker_profile: { user_id: 'u2', headline: 'Backend', app_user: { full_name: 'Bruno' }, worker_skill: [{ skill: { name: 'Node.js' } }] },
    });
    const { prisma, tx } = prismaMock({ job_application: { findUnique, findUniqueOrThrow } });
    const service = await setup(prisma);

    await expect(service.updateStatus('a1', { status: 'reviewing' }, worker)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.updateStatus('a1', { status: 'offer' }, employer)).rejects.toBeInstanceOf(ConflictException);

    const result = await service.updateStatus('a1', { status: 'reviewing', note: 'Buen perfil' }, employer);

    expect(tx.job_application_event.create.mock.calls[0][0].data).toMatchObject({ from_status: 'applied', to_status: 'reviewing', note: 'Buen perfil', changed_by: 'u4' });
    expect(result).toMatchObject({ status: 'reviewing', worker: { fullName: 'Bruno', skills: ['Node.js'] } });
  });
});
