import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

export interface SkillDto {
  id: string;
  name: string;
  category: string;
}

@Injectable()
export class SkillTable {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<SkillDto[]> {
    return this.prisma.skill.findMany({ select: { id: true, name: true, category: true }, orderBy: { name: 'asc' } });
  }

  countByIds(ids: string[]): Promise<number> {
    return this.prisma.skill.count({ where: { id: { in: ids } } });
  }
}
