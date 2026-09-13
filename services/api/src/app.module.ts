import { fileURLToPath } from 'node:url';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApplicationsModule } from './applications/applications.module.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthController } from './health/health.controller.js';
import { JobsModule } from './jobs/jobs.module.js';
import { PrismaModule } from './database/prisma.module.js';
import { SkillsModule } from './skills/skills.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Un solo .env para todo el repo: proyectos/portafolio/.env. Las variables ya presentes en el entorno (compose) tienen prioridad.
      envFilePath: fileURLToPath(new URL('../../../.env', import.meta.url)),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SkillsModule,
    JobsModule,
    ApplicationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
