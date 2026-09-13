import { Controller, Get } from '@nestjs/common';
import { Auth } from '../auth/auth.decorators.js';
import { PrismaService } from '../database/prisma.service.js';

export interface SkillDto {
  id: string;
  name: string;
  category: string;
}

@Auth()
@Controller('skills')
export class SkillsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(): Promise<SkillDto[]> {
    return this.prisma.skill.findMany({ select: { id: true, name: true, category: true }, orderBy: { name: 'asc' } });
  }
}
