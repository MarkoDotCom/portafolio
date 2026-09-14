import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { CurrentUserData } from '../auth/current-user.js';
import { WorkerProfileTable } from '../../database/tables/worker-profile.table.js';
import { WorkersService } from './workers.service.js';

const ana: CurrentUserData = { id: 'u1', fullName: 'Ana', isWorker: true, companies: [] };
const diego: CurrentUserData = { id: 'u4', fullName: 'Diego', isWorker: false, companies: [{ id: 'c1', role: 'recruiter' }] };

async function setup(findPortfolio: (id: string) => unknown) {
  const moduleRef = await Test.createTestingModule({
    providers: [WorkersService, { provide: WorkerProfileTable, useValue: { findPortfolio: vi.fn(findPortfolio) } }],
  }).compile();
  return moduleRef.get(WorkersService);
}

describe('WorkersService', () => {
  it('returns 404 for a user without worker profile', async () => {
    const service = await setup(async () => null);
    await expect(service.getMine(diego)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('shows a private profile only to its owner', async () => {
    const service = await setup(async (id) => ({ id, isPublic: false }));
    await expect(service.getPublic('u1', ana)).resolves.toMatchObject({ id: 'u1' });
    await expect(service.getPublic('u1', diego)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('shows a public profile to anyone', async () => {
    const service = await setup(async (id) => ({ id, isPublic: true }));
    await expect(service.getPublic('u1', diego)).resolves.toMatchObject({ id: 'u1' });
  });
});
