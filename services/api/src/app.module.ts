import { fileURLToPath } from 'node:url';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';
import { IntegrationsModule } from './integrations/integrations.module.js';
import { RestModule } from './rest/rest.module.js';

// Tres capas con dependencias en un solo sentido:
//   rest  →  database, integrations       (endpoints HTTP de negocio)
//   integrations  →  (nada nuestro)        (APIs de terceros)
//   database  →  (nada nuestro)            (tablas vía Prisma)
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Un solo .env para todo el repo: proyectos/bolsa-laboral/.env. Las variables ya presentes en el entorno (compose) tienen prioridad.
      envFilePath: fileURLToPath(new URL('../../../.env', import.meta.url)),
    }),
    DatabaseModule,
    IntegrationsModule,
    RestModule,
  ],
})
export class AppModule {}
