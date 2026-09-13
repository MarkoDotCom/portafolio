import type { UserSummary } from './users.api';

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Jornada completa',
  part_time: 'Media jornada',
  contract: 'Contrato',
  internship: 'Práctica',
  freelance: 'Freelance',
};

export const WORK_MODE_LABELS: Record<string, string> = {
  onsite: 'Presencial',
  hybrid: 'Híbrido',
  remote: 'Remoto',
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  closed: 'Cerrada',
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  applied: 'Postulado',
  reviewing: 'En revisión',
  interview: 'Entrevista',
  offer: 'Oferta',
  rejected: 'Rechazado',
  withdrawn: 'Retirada',
};

// Espejo de las reglas de la API (applications.service.ts)
export const TERMINAL_APPLICATION_STATUSES = ['offer', 'rejected', 'withdrawn'];

export const EMPLOYER_TRANSITIONS: Record<string, string[]> = {
  applied: ['reviewing', 'rejected'],
  reviewing: ['interview', 'rejected'],
  interview: ['offer', 'rejected'],
};

/** Headline del trabajador o, si no tiene, las empresas donde es empleador. */
export function userSubtitle(user: UserSummary): string {
  return user.headline ?? user.companies.map((c) => c.name).join(', ');
}

/** Página de inicio según el rol del usuario en sesión. */
export function homeFor(user: UserSummary): string {
  return user.roles.includes('employer') ? '/empresa/ofertas' : '/ofertas';
}

const currencyFormat = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

/** "1.000.000 – 2.000.000 CLP", o null si la oferta no indica salario. */
export function formatSalary(job: { salaryMin: number | null; salaryMax: number | null; salaryCurrency: string | null }): string | null {
  if (job.salaryMin === null && job.salaryMax === null) return null;
  const range = [job.salaryMin, job.salaryMax].filter((v): v is number => v !== null).map((v) => currencyFormat.format(v));
  return `${range.join(' – ')} ${job.salaryCurrency ?? ''}`.trim();
}
