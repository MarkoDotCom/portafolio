import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

export interface NewAppUser {
  email: string;
  fullName: string;
  role: 'worker' | 'employer';
  headline: string | null;
  location: string | null;
  openToWork: boolean;
  companyName: string | null;
}

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

/** "Ana María Rojas" → "ana-maria-rojas" */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'usuario';
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

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.prisma.app_user.count({ where: { email } })) > 0;
  }

  /** Crea la cuenta y, según el rol, el perfil de trabajador o la empresa con el usuario como owner. */
  async create(user: NewAppUser): Promise<AppUserWithRoles> {
    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.app_user.create({ data: { email: user.email, full_name: user.fullName } });

      if (user.role === 'worker') {
        const taken = (await tx.worker_profile.findMany({ select: { slug: true } })).map((p) => p.slug);
        await tx.worker_profile.create({
          data: {
            user_id: created.id,
            slug: uniqueSlug(user.fullName, taken),
            headline: user.headline,
            location: user.location,
            open_to_work: user.openToWork,
          },
        });
      } else {
        const taken = (await tx.company.findMany({ select: { slug: true } })).map((c) => c.slug);
        await tx.company.create({
          data: {
            slug: uniqueSlug(user.companyName ?? user.fullName, taken),
            name: user.companyName ?? user.fullName,
            created_by: created.id,
            company_member: { create: { user_id: created.id, role: 'owner' } },
          },
        });
      }

      return tx.app_user.findUniqueOrThrow({ where: { id: created.id }, include: INCLUDE });
    });
    return toUser(row);
  }
}

/** Slug base o, si ya existe, base-2, base-3, ... */
function uniqueSlug(text: string, taken: string[]): string {
  const base = slugify(text);
  const used = new Set(taken.map((s) => s.toLowerCase()));
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
