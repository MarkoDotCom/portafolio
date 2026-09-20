// Alta de usuarios contra la base del compose. Borra lo que crea al final.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('Usuarios (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const ids: string[] = [];
  const suffix = Date.now();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // company.created_by no es cascade: primero las empresas creadas por estos usuarios
    await prisma.company.deleteMany({ where: { created_by: { in: ids } } });
    await prisma.app_user.deleteMany({ where: { id: { in: ids } } }); // cascade: worker_profile y company_member
    await app.close();
  });

  it('creates a worker with a profile and a generated slug', async () => {
    const res = await request(app.getHttpServer()).post('/users').send({
      email: `e2e.worker.${suffix}@example.com`,
      fullName: 'Ana Rojas',
      role: 'worker',
      headline: 'QA e2e',
      openToWork: true,
    }).expect(201);
    ids.push(res.body.id);

    expect(res.body).toMatchObject({ fullName: 'Ana Rojas', headline: 'QA e2e', roles: ['worker'], companies: [] });
    const profile = await prisma.worker_profile.findUniqueOrThrow({ where: { user_id: res.body.id } });
    expect(profile.slug).toBe('ana-rojas-2'); // "ana-rojas" es de la seed
    expect(profile.open_to_work).toBe(true);
  });

  it('creates an employer as owner of a new company', async () => {
    const res = await request(app.getHttpServer()).post('/users').send({
      email: `e2e.employer.${suffix}@example.com`,
      fullName: 'Eva Soto',
      role: 'employer',
      companyName: 'Empresa E2E',
    }).expect(201);
    ids.push(res.body.id);

    expect(res.body).toMatchObject({ roles: ['employer'], companies: [{ name: 'Empresa E2E', role: 'owner' }] });
  });

  it('validates the body and rejects duplicated emails', async () => {
    await request(app.getHttpServer()).post('/users').send({ email: 'no-es-email', fullName: 'X', role: 'worker' }).expect(400);
    await request(app.getHttpServer()).post('/users').send({ email: `x.${suffix}@example.com`, fullName: 'Sin empresa', role: 'employer' }).expect(400);
    await request(app.getHttpServer()).post('/users').send({ email: 'ANA.ROJAS@example.com', fullName: 'Ana', role: 'worker' }).expect(409);
  });
});
