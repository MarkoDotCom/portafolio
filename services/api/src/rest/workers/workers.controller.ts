import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Auth, CurrentUser } from '../auth/auth.decorators.js';
import type { CurrentUserData } from '../auth/current-user.js';
import type { WorkerPortfolioDto } from '../../database/tables/worker-profile.table.js';
import { WorkersService } from './workers.service.js';

@Auth()
@Controller('workers')
export class WorkersController {
  constructor(private readonly workers: WorkersService) {}

  // Antes de ':id' para que 'me' no caiga en ParseUUIDPipe
  @Auth('worker')
  @Get('me')
  getMine(@CurrentUser() user: CurrentUserData): Promise<WorkerPortfolioDto> {
    return this.workers.getMine(user);
  }

  @Get(':id')
  getPublic(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserData): Promise<WorkerPortfolioDto> {
    return this.workers.getPublic(id, user);
  }
}
