import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

export interface AppUserWithRoles {
  id: string;
  email: string;
  fullName: string;
  headline: string | null;
  isWorker: boolean;
  companies: { id: string; name: string; role: 'owner' | 'recruiter' }[];
}

const INCLUDE = {
  worker_profile: { select: { headline: true } },
  company_member: { select: { role: true, company: { select: { id: true, name: true } } } },
} as const;

interface Row {
  id: string;
  email: string;
  full_name: string;
  worker_profile: { headline: string | null } | null;
  company_member: { role: 'owner' | 'recruiter'; company: { id: string; name: string } }[];
}

function toUser(row: Row): AppUserWithRoles {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    headline: row.worker_profile?.headline ?? null,
    isWorker: row.worker_profile !== null,
    companies: row.company_member.map((m) => ({ id: m.company.id, name: m.company.name, role: m.role })),
  };
}

@Injectable()
export class AppUserTable {
  constructor(private readonly prisma: PrismaService) {}

  async findWithRoles(id: string): Promise<AppUserWithRoles | null> {
    const row = await this.prisma.app_user.findUnique({ where: { id }, include: INCLUDE });
    return row && toUser(row);
  }

  async listWithRoles(): Promise<AppUserWithRoles[]> {
    const rows = await this.prisma.app_user.findMany({ include: INCLUDE, orderBy: { full_name: 'asc' } });
    return rows.map(toUser);
  }
}
