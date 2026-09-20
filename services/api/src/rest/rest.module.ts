import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ApiResponseFilter } from './api-response.filter.js';
import { ApiResponseInterceptor } from './api-response.interceptor.js';
import { ApplicationsModule } from './applications/applications.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health/health.controller.js';
import { JobsModule } from './jobs/jobs.module.js';
import { SkillsModule } from './skills/skills.module.js';
import { UsersModule } from './users/users.module.js';
import { WorkersModule } from './workers/workers.module.js';

// Endpoints HTTP de negocio. Usa DatabaseModule e IntegrationsModule; nunca al revés.
@Module({
  imports: [AuthModule, UsersModule, WorkersModule, SkillsModule, JobsModule, ApplicationsModule],
  controllers: [HealthController],
  // Toda respuesta, éxito o error, sale con el mismo envoltorio; ver api-response.ts
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
    { provide: APP_FILTER, useClass: ApiResponseFilter },
  ],
})
export class RestModule {}
