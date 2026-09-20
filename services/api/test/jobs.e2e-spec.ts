// Flujo completo empleador ↔ trabajador contra la base del compose. Crea su propia oferta y la borra al final.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';

const ANA = '10000000-0000-4000-8000-000000000001';
const BRUNO = '10000000-0000-4000-8000-000000000002';
const DIEGO = '10000000-0000-4000-8000-000000000004';
const NORTECH = '30000000-0000-4000-8000-000000000001';
const SEEDED_JOB = '90000000-0000-4000-8000-000000000001';

describe('Ofertas y postulaciones (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jobId: string;
  let applicationId: string;

  const as = (user: string) => ({ 'x-user-id': user });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (jobId) await prisma.job_posting.delete({ where: { id: jobId } }); // cascade: postulaciones y eventos
    await app.close();
  });

  it('requires x-user-id and the employer role', async () => {
    await request(app.getHttpServer()).get('/jobs').expect(401);
    await request(app.getHttpServer()).post('/jobs').set(as(BRUNO)).send({}).expect(403);
  });

  it('wraps every response in the same envelope with a traceId', async () => {
    const ok = await request(app.getHttpServer()).get('/skills').set(as(DIEGO)).set('x-request-id', 'e2e-trace-1').expect(200);
    expect(ok.headers['x-request-id']).toBe('e2e-trace-1');
    expect(ok.body).toMatchObject({ success: true, status: 200, message: 'OK', traceId: 'e2e-trace-1', data: expect.any(Array) });

    const forbidden = await request(app.getHttpServer()).post('/jobs').set(as(BRUNO)).send({}).expect(403);
    expect(forbidden.body).toMatchObject({
      success: false,
      status: 403,
      code: 'FORBIDDEN',
      message: 'Tu usuario no tiene el rol requerido',
      traceId: forbidden.headers['x-request-id'],
    });
    expect(forbidden.body.traceId).toMatch(/^[0-9a-f-]{36}$/);

    const invalid = await request(app.getHttpServer()).post('/jobs').set(as(DIEGO)).send({}).expect(400);
    expect(invalid.body).toMatchObject({ success: false, status: 400, code: 'BAD_REQUEST' });
    expect(typeof invalid.body.message).toBe('string');
    expect(invalid.body.errors.length).toBeGreaterThan(1);
  });

  it('employer creates a draft with a required skill', async () => {
    const skills = await request(app.getHttpServer()).get('/skills').set(as(DIEGO)).expect(200);
    const angular = skills.body.data.find((s: { name: string }) => s.name === 'Angular');

    const res = await request(app.getHttpServer()).post('/jobs').set(as(DIEGO)).send({
      companyId: NORTECH,
      title: 'E2E Frontend',
      description: 'Oferta creada por la prueba e2e',
      employmentType: 'contract',
      workMode: 'remote',
      salaryMin: 1000,
      salaryMax: 2000,
      salaryCurrency: 'usd',
      skills: [{ skillId: angular.id, required: true }],
    }).expect(201);

    jobId = res.body.data.id;
    expect(res.body.data).toMatchObject({ status: 'draft', salaryCurrency: 'USD', skills: [{ name: 'Angular', required: true }] });
  });

  it('a draft is invisible to workers and cannot receive applications', async () => {
    const list = await request(app.getHttpServer()).get('/jobs').set(as(BRUNO)).expect(200);
    expect(list.body.data.map((j: { id: string }) => j.id)).not.toContain(jobId);
    await request(app.getHttpServer()).get(`/jobs/${jobId}`).set(as(BRUNO)).expect(404);
    await request(app.getHttpServer()).get(`/jobs/${jobId}`).set(as(DIEGO)).expect(200);
    await request(app.getHttpServer()).post(`/jobs/${jobId}/applications`).set(as(BRUNO)).send({}).expect(409);
  });

  it('employer publishes, worker applies once', async () => {
    const published = await request(app.getHttpServer()).patch(`/jobs/${jobId}/status`).set(as(DIEGO)).send({ status: 'published' }).expect(200);
    expect(published.body.data.publishedAt).toBeTruthy();

    const list = await request(app.getHttpServer()).get('/jobs').set(as(BRUNO)).expect(200);
    expect(list.body.data.map((j: { id: string }) => j.id)).toContain(jobId);

    const applied = await request(app.getHttpServer()).post(`/jobs/${jobId}/applications`).set(as(BRUNO)).send({ coverLetter: 'Me interesa' }).expect(201);
    applicationId = applied.body.data.id;
    expect(applied.body.data).toMatchObject({ status: 'applied', job: { id: jobId, company: { name: 'Nortech Labs' } } });

    await request(app.getHttpServer()).post(`/jobs/${jobId}/applications`).set(as(BRUNO)).send({}).expect(409);
    await request(app.getHttpServer()).post(`/jobs/${SEEDED_JOB}/applications`).set(as(ANA)).send({}).expect(409); // ya está en el seed
  });

  it('employer reviews applicants and moves the pipeline', async () => {
    const applicants = await request(app.getHttpServer()).get(`/jobs/${jobId}/applications`).set(as(DIEGO)).expect(200);
    expect(applicants.body.data).toHaveLength(1);
    expect(applicants.body.data[0]).toMatchObject({ id: applicationId, status: 'applied', worker: { fullName: 'Bruno Díaz' } });
    expect(applicants.body.data[0].worker.skills).toContain('Node.js');

    await request(app.getHttpServer()).patch(`/applications/${applicationId}/status`).set(as(DIEGO)).send({ status: 'offer' }).expect(409);
    const reviewing = await request(app.getHttpServer()).patch(`/applications/${applicationId}/status`).set(as(DIEGO)).send({ status: 'reviewing', note: 'Perfil interesante' }).expect(200);
    expect(reviewing.body.data.status).toBe('reviewing');
  });

  it('worker sees the status and withdraws; afterwards the employer cannot move it', async () => {
    const mine = await request(app.getHttpServer()).get('/applications/mine').set(as(BRUNO)).expect(200);
    expect(mine.body.data.find((a: { id: string }) => a.id === applicationId)).toMatchObject({ status: 'reviewing', job: { title: 'E2E Frontend' } });

    const withdrawn = await request(app.getHttpServer()).post(`/applications/${applicationId}/withdraw`).set(as(BRUNO)).expect(201);
    expect(withdrawn.body.data.status).toBe('withdrawn');
    await request(app.getHttpServer()).patch(`/applications/${applicationId}/status`).set(as(DIEGO)).send({ status: 'interview' }).expect(409);

    const events = await prisma.job_application_event.findMany({ where: { application_id: applicationId }, orderBy: { created_at: 'asc' } });
    expect(events.map((e) => e.to_status)).toEqual(['applied', 'reviewing', 'withdrawn']);
  });

  it('employer closes the job', async () => {
    const closed = await request(app.getHttpServer()).patch(`/jobs/${jobId}/status`).set(as(DIEGO)).send({ status: 'closed' }).expect(200);
    expect(closed.body.data.status).toBe('closed');
  });
});
