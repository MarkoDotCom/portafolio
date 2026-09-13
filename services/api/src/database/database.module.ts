import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { AppUserTable } from './tables/app-user.table.js';
import { JobApplicationTable } from './tables/job-application.table.js';
import { JobPostingTable } from './tables/job-posting.table.js';
import { SkillTable } from './tables/skill.table.js';

// Único punto de acceso a la base: los módulos de negocio inyectan las tablas, no Prisma.
const TABLES = [AppUserTable, SkillTable, JobPostingTable, JobApplicationTable];

@Global()
@Module({
  providers: [PrismaService, ...TABLES],
  exports: [PrismaService, ...TABLES],
})
export class DatabaseModule {}
