import { Controller, Get } from '@nestjs/common';
import { Auth } from '../auth/auth.decorators.js';
import { SkillTable, type SkillDto } from '../../database/tables/skill.table.js';

@Auth()
@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillTable) {}

  @Get()
  list(): Promise<SkillDto[]> {
    return this.skills.list();
  }
}
