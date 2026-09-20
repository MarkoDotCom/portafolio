import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';

const ANA = '10000000-0000-4000-8000-000000000001';
const BRUNO = '10000000-0000-4000-8000-000000000002';
const DIEGO = '10000000-0000-4000-8000-000000000004';

describe('Perfil del trabajador (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const as = (user: string) => ({ 'x-user-id': user });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.worker_profile.update({ where: { user_id: BRUNO }, data: { is_public: true } });
    await app.close();
  });

  it('returns the full portfolio of the seeded worker', async () => {
    const res = await request(app.getHttpServer()).get('/workers/me').set(as(ANA)).expect(200);
    expect(res.body.data).toMatchObject({ id: ANA, fullName: 'Ana Rojas', slug: 'ana-rojas', openToWork: true, avatarUrl: expect.stringContaining('ana.png') });
    expect(res.body.data.skills.map((s: { name: string }) => s.name)).toContain('Angular');
    expect(res.body.data.experience).toHaveLength(2);
    expect(res.body.data.experience[0]).toMatchObject({ companyName: 'Agencia Pixel', endDate: null, skills: expect.arrayContaining(['Angular']) });
    expect(res.body.data.experience[1].companyId).toBe('30000000-0000-4000-8000-000000000001');
    expect(res.body.data.education).toHaveLength(1);
    expect(res.body.data.certifications[0]).toMatchObject({ issuer: 'IAAP' });
    expect(res.body.data.projects[0]).toMatchObject({ slug: 'ui-kit', isFeatured: true, coverUrl: expect.stringContaining('ui-kit-cover') });
    expect(res.body.data.socialLinks).toHaveLength(2);
  });

  it('employers have no own portfolio but can read public ones', async () => {
    await request(app.getHttpServer()).get('/workers/me').set(as(DIEGO)).expect(403);
    const res = await request(app.getHttpServer()).get(`/workers/${ANA}`).set(as(DIEGO)).expect(200);
    expect(res.body.data.fullName).toBe('Ana Rojas');
  });

  it('hides a private profile from everyone but its owner', async () => {
    await prisma.worker_profile.update({ where: { user_id: BRUNO }, data: { is_public: false } });
    await request(app.getHttpServer()).get(`/workers/${BRUNO}`).set(as(DIEGO)).expect(404);
    await request(app.getHttpServer()).get(`/workers/${BRUNO}`).set(as(BRUNO)).expect(200);
  });
});
