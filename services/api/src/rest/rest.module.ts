import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ApplicationsModule } from './applications/applications.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health/health.controller.js';
import { JobsModule } from './jobs/jobs.module.js';
import { ProblemDetailsFilter } from './problem-details.filter.js';
import { SkillsModule } from './skills/skills.module.js';
import { UsersModule } from './users/users.module.js';
import { WorkersModule } from './workers/workers.module.js';

// Endpoints HTTP de negocio. Usa DatabaseModule e IntegrationsModule; nunca al revés.
@Module({
  imports: [AuthModule, UsersModule, WorkersModule, SkillsModule, JobsModule, ApplicationsModule],
  controllers: [HealthController],
  // Todos los errores salen con el mismo cuerpo (RFC 9457); ver problem-details.filter.ts
  providers: [{ provide: APP_FILTER, useClass: ProblemDetailsFilter }],
})
export class RestModule {}
