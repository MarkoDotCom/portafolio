import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';
import { AppUserTable } from '../../database/tables/app-user.table.js';
import { AUTH_ROLES } from './auth.decorators.js';
import { hasRole, type RequestWithUser, type Role } from './current-user.js';

// Identidad provisional: el cliente manda el id del usuario elegido en x-user-id.
// Cuando exista autenticación real solo cambia cómo se obtiene el id.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly users: AppUserTable,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(AUTH_ROLES, [ctx.getHandler(), ctx.getClass()]);
    if (roles === undefined) return true; // ruta sin @Auth(): pública

    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    const id = req.header('x-user-id');
    if (!id || !isUUID(id)) throw new UnauthorizedException('Falta la cabecera x-user-id');

    const user = await this.users.findWithRoles(id);
    if (!user) throw new UnauthorizedException('Usuario desconocido');

    req.user = {
      id: user.id,
      fullName: user.fullName,
      isWorker: user.isWorker,
      companies: user.companies.map((c) => ({ id: c.id, role: c.role })),
    };

    if (roles.length > 0 && !roles.some((r) => hasRole(req.user!, r))) {
      throw new ForbiddenException('Tu usuario no tiene el rol requerido');
    }
    return true;
  }
}
