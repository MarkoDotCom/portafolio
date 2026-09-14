import { fileURLToPath } from 'node:url';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiModule } from './api/api.module.js';
import { DatabaseModule } from './database/database.module.js';
import { IntegrationsModule } from './integrations/integrations.module.js';

// Tres capas con dependencias en un solo sentido:
//   api  →  database, integrations        (endpoints HTTP de negocio)
//   integrations  →  (nada nuestro)        (APIs de terceros)
//   database  →  (nada nuestro)            (tablas vía Prisma)
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Un solo .env para todo el repo: proyectos/portafolio/.env. Las variables ya presentes en el entorno (compose) tienen prioridad.
      envFilePath: fileURLToPath(new URL('../../../.env', import.meta.url)),
    }),
    DatabaseModule,
    IntegrationsModule,
    ApiModule,
  ],
})
export class AppModule {}
