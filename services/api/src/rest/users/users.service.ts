import { Injectable } from '@nestjs/common';
import { AppUserTable } from '../../database/tables/app-user.table.js';

export type UserRole = 'worker' | 'employer';

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  headline: string | null;
  roles: UserRole[];
  companies: { id: string; name: string; role: 'owner' | 'recruiter' }[];
}

@Injectable()
export class UsersService {
  constructor(private readonly users: AppUserTable) {}

  async findAll(): Promise<UserSummary[]> {
    const users = await this.users.listWithRoles();
    return users.map((u) => {
      const roles: UserRole[] = [];
      if (u.isWorker) roles.push('worker');
      if (u.companies.length > 0) roles.push('employer');
      return { id: u.id, fullName: u.fullName, email: u.email, headline: u.headline, roles, companies: u.companies };
    });
  }
}
