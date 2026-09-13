import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';

export type Role = 'worker' | 'employer';

export interface CurrentUserData {
  id: string;
  fullName: string;
  isWorker: boolean;
  companies: { id: string; role: 'owner' | 'recruiter' }[];
}

export type RequestWithUser = Request & { user?: CurrentUserData };

export function hasRole(user: CurrentUserData, role: Role): boolean {
  return role === 'worker' ? user.isWorker : user.companies.length > 0;
}

export function assertMember(user: CurrentUserData, companyId: string): void {
  if (!user.companies.some((c) => c.id === companyId)) {
    throw new ForbiddenException('No eres miembro de esta empresa');
  }
}
