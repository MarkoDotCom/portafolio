import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

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
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserSummary[]> {
    const users = await this.prisma.app_user.findMany({
      include: {
        worker_profile: { select: { headline: true } },
        company_member: { select: { role: true, company: { select: { id: true, name: true } } } },
      },
      orderBy: { full_name: 'asc' },
    });

    return users.map((u) => {
      const roles: UserRole[] = [];
      if (u.worker_profile) roles.push('worker');
      if (u.company_member.length > 0) roles.push('employer');
      return {
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        headline: u.worker_profile?.headline ?? null,
        roles,
        companies: u.company_member.map((m) => ({ id: m.company.id, name: m.company.name, role: m.role })),
      };
    });
  }
}
