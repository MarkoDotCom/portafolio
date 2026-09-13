// Requiere la base de datos del compose levantada (DATABASE_URL en ../../.env)
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok', database: 'up' });
  });

  it('/users (GET) returns the seeded users with roles', async () => {
    const res = await request(app.getHttpServer()).get('/users').expect(200);
    expect(res.body).toHaveLength(4);
    expect(res.body.map((u: { fullName: string; roles: string[] }) => [u.fullName, u.roles])).toEqual([
      ['Ana Rojas', ['worker']],
      ['Bruno Díaz', ['worker']],
      ['Carla Muñoz', ['employer']],
      ['Diego Pérez', ['employer']],
    ]);
  });

  afterEach(async () => {
    await app.close();
  });
});
