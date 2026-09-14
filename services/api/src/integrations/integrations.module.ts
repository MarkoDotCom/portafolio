import { Module } from '@nestjs/common';

// Clientes de APIs de terceros (openai/, clerk/, ...): cada proveedor en su carpeta, registrado aquí.
// No depende de database/ ni de api/.
@Module({
  providers: [],
  exports: [],
})
export class IntegrationsModule {}
