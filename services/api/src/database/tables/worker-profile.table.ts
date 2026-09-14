import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

export interface WorkerPortfolioDto {
  id: string;
  slug: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  headline: string | null;
  summary: string | null;
  location: string | null;
  isPublic: boolean;
  openToWork: boolean;
  socialLinks: { platform: string; url: string }[];
  skills: { id: string; name: string; category: string; level: number | null }[];
  experience: {
    id: string;
    title: string;
    companyName: string;
    companyId: string | null;
    employmentType: string | null;
    workMode: string | null;
    location: string | null;
    startDate: Date;
    endDate: Date | null;
    description: string | null;
    skills: string[];
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string | null;
    startDate: Date;
    endDate: Date | null;
    description: string | null;
  }[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    issuedAt: Date;
    expiresAt: Date | null;
    credentialId: string | null;
    credentialUrl: string | null;
  }[];
  projects: {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    description: string | null;
    repoUrl: string | null;
    demoUrl: string | null;
    coverUrl: string | null;
    startedAt: Date | null;
    endedAt: Date | null;
    isFeatured: boolean;
    skills: string[];
  }[];
}

@Injectable()
export class WorkerProfileTable {
  constructor(private readonly prisma: PrismaService) {}

  /** Perfil completo del trabajador con todas sus secciones visibles, en una consulta. */
  async findPortfolio(userId: string): Promise<WorkerPortfolioDto | null> {
    const row = await this.prisma.worker_profile.findUnique({
      where: { user_id: userId },
      include: {
        app_user: {
          select: { full_name: true, email: true, media_asset_app_user_avatar_media_idTomedia_asset: { select: { url: true } } },
        },
        social_link: { orderBy: { sort_order: 'asc' } },
        worker_skill: { include: { skill: true }, orderBy: { sort_order: 'asc' } },
        experience: {
          where: { is_visible: true },
          orderBy: { sort_order: 'asc' },
          include: { experience_skill: { select: { skill: { select: { name: true } } } } },
        },
        education: { where: { is_visible: true }, orderBy: { sort_order: 'asc' } },
        certification: { where: { is_visible: true }, orderBy: { sort_order: 'asc' } },
        project: {
          where: { is_visible: true },
          orderBy: [{ is_featured: 'desc' }, { sort_order: 'asc' }],
          include: { project_skill: { select: { skill: { select: { name: true } } } }, media_asset: { select: { url: true } } },
        },
      },
    });
    if (!row) return null;

    return {
      id: row.user_id,
      slug: row.slug,
      fullName: row.app_user.full_name,
      email: row.app_user.email,
      avatarUrl: row.app_user.media_asset_app_user_avatar_media_idTomedia_asset?.url ?? null,
      headline: row.headline,
      summary: row.summary,
      location: row.location,
      isPublic: row.is_public,
      openToWork: row.open_to_work,
      socialLinks: row.social_link.map((l) => ({ platform: l.platform, url: l.url })),
      skills: row.worker_skill.map((s) => ({ id: s.skill.id, name: s.skill.name, category: s.skill.category, level: s.level })),
      experience: row.experience.map((e) => ({
        id: e.id,
        title: e.title,
        companyName: e.company_name,
        companyId: e.company_id,
        employmentType: e.employment_type,
        workMode: e.work_mode,
        location: e.location,
        startDate: e.start_date,
        endDate: e.end_date,
        description: e.description,
        skills: e.experience_skill.map((s) => s.skill.name),
      })),
      education: row.education.map((e) => ({
        id: e.id,
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.field_of_study,
        startDate: e.start_date,
        endDate: e.end_date,
        description: e.description,
      })),
      certifications: row.certification.map((c) => ({
        id: c.id,
        name: c.name,
        issuer: c.issuer,
        issuedAt: c.issued_at,
        expiresAt: c.expires_at,
        credentialId: c.credential_id,
        credentialUrl: c.credential_url,
      })),
      projects: row.project.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        description: p.description,
        repoUrl: p.repo_url,
        demoUrl: p.demo_url,
        coverUrl: p.media_asset?.url ?? null,
        startedAt: p.started_at,
        endedAt: p.ended_at,
        isFeatured: p.is_featured,
        skills: p.project_skill.map((s) => s.skill.name),
      })),
    };
  }
}
