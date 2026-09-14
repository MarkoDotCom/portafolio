import { Test } from '@nestjs/testing';
import { AppUserTable } from '../../database/tables/app-user.table.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  it('derives roles from worker profile and company memberships', async () => {
    const listWithRoles = vi.fn().mockResolvedValue([
      { id: 'u1', fullName: 'Ana', email: 'ana@example.com', headline: 'Frontend', isWorker: true, companies: [] },
      { id: 'u3', fullName: 'Carla', email: 'carla@example.com', headline: null, isWorker: false, companies: [{ id: 'c1', name: 'Nortech Labs', role: 'owner' }] },
    ]);

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: AppUserTable, useValue: { listWithRoles } }],
    }).compile();

    const result = await moduleRef.get(UsersService).findAll();

    expect(result).toEqual([
      { id: 'u1', fullName: 'Ana', email: 'ana@example.com', headline: 'Frontend', roles: ['worker'], companies: [] },
      { id: 'u3', fullName: 'Carla', email: 'carla@example.com', headline: null, roles: ['employer'], companies: [{ id: 'c1', name: 'Nortech Labs', role: 'owner' }] },
    ]);
  });
});
