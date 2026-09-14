import { Injectable, NotFoundException } from '@nestjs/common';
import type { CurrentUserData } from '../auth/current-user.js';
import { WorkerProfileTable, type WorkerPortfolioDto } from '../../database/tables/worker-profile.table.js';

@Injectable()
export class WorkersService {
  constructor(private readonly workers: WorkerProfileTable) {}

  async getMine(user: CurrentUserData): Promise<WorkerPortfolioDto> {
    const portfolio = await this.workers.findPortfolio(user.id);
    if (!portfolio) throw new NotFoundException('No tienes perfil de trabajador');
    return portfolio;
  }

  /** El perfil de otro trabajador solo se ve si es público; el propio, siempre. */
  async getPublic(id: string, user: CurrentUserData): Promise<WorkerPortfolioDto> {
    const portfolio = await this.workers.findPortfolio(id);
    if (!portfolio || (!portfolio.isPublic && portfolio.id !== user.id)) throw new NotFoundException('Perfil no encontrado');
    return portfolio;
  }
}
