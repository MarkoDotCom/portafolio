import { Module } from '@nestjs/common';
import { ApplicationsModule } from './applications/applications.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health/health.controller.js';
import { JobsModule } from './jobs/jobs.module.js';
import { SkillsModule } from './skills/skills.module.js';
import { UsersModule } from './users/users.module.js';

// Endpoints HTTP de negocio. Usa DatabaseModule e IntegrationsModule; nunca al revés.
@Module({
  imports: [AuthModule, UsersModule, SkillsModule, JobsModule, ApplicationsModule],
  controllers: [HealthController],
})
export class ApiModule {}
