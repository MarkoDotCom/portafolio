import { fileURLToPath } from 'node:url';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Un solo .env para todo el repo: proyectos/portafolio/.env. Las variables ya presentes en el entorno (compose) tienen prioridad.
      envFilePath: fileURLToPath(new URL('../../../.env', import.meta.url)),
    }),
    PrismaModule,
    UsersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
