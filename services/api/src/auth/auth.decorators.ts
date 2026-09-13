import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { CurrentUserData, RequestWithUser, Role } from './current-user.js';

export const AUTH_ROLES = 'auth:roles';

/** Exige la cabecera x-user-id. Con roles, exige además que el usuario tenga alguno de ellos. */
export const Auth = (...roles: Role[]) => SetMetadata(AUTH_ROLES, roles);

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): CurrentUserData => {
  const user = ctx.switchToHttp().getRequest<RequestWithUser>().user;
  if (!user) throw new Error('@CurrentUser() requiere @Auth() en la ruta');
  return user;
});
