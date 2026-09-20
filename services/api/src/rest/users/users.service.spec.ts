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

  it('creates a worker and rejects duplicated emails', async () => {
    const created = { id: 'u9', fullName: 'Eva', email: 'eva@example.com', headline: 'QA', isWorker: true, companies: [] };
    const existsByEmail = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const create = vi.fn().mockResolvedValue(created);

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: AppUserTable, useValue: { existsByEmail, create } }],
    }).compile();
    const service = moduleRef.get(UsersService);

    const dto = { email: 'eva@example.com', fullName: 'Eva', role: 'worker' as const, headline: 'QA', companyName: 'Ignorada' };
    await expect(service.create(dto)).resolves.toEqual({ id: 'u9', fullName: 'Eva', email: 'eva@example.com', headline: 'QA', roles: ['worker'], companies: [] });
    expect(create).toHaveBeenCalledWith({
      email: 'eva@example.com', fullName: 'Eva', role: 'worker', headline: 'QA', location: null, openToWork: false, companyName: null,
    });

    await expect(service.create(dto)).rejects.toThrow('Ya existe un usuario con ese email');
    expect(create).toHaveBeenCalledTimes(1);
  });
});
