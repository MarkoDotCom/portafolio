import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type UserRole = 'worker' | 'employer';

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  headline: string | null;
  roles: UserRole[];
  companies: string[];
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserSummary[]> {
    const users = await this.prisma.app_user.findMany({
      include: {
        worker_profile: { select: { headline: true } },
        company_member: { select: { company: { select: { name: true } } } },
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
        companies: u.company_member.map((m) => m.company.name),
      };
    });
  }
}
