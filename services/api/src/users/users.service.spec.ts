import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  it('maps worker_profile and company_member to roles', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'u1',
        full_name: 'Ana',
        email: 'ana@example.com',
        worker_profile: { headline: 'Frontend' },
        company_member: [],
      },
      {
        id: 'u3',
        full_name: 'Carla',
        email: 'carla@example.com',
        worker_profile: null,
        company_member: [{ company: { name: 'Nortech Labs' } }],
      },
    ]);

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: { app_user: { findMany } } }],
    }).compile();

    const result = await moduleRef.get(UsersService).findAll();

    expect(result).toEqual([
      { id: 'u1', fullName: 'Ana', email: 'ana@example.com', headline: 'Frontend', roles: ['worker'], companies: [] },
      { id: 'u3', fullName: 'Carla', email: 'carla@example.com', headline: null, roles: ['employer'], companies: ['Nortech Labs'] },
    ]);
  });
});
