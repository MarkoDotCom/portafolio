// Vista del trabajador: sus postulaciones
export interface ApplicationDto {
  id: string;
  status: string;
  coverLetter: string | null;
  appliedAt: Date;
  job: { id: string; title: string; company: { id: string; name: string } };
}

// Vista del empleador: postulantes de una oferta
export interface ApplicantDto {
  id: string;
  status: string;
  coverLetter: string | null;
  appliedAt: Date;
  worker: { id: string; fullName: string; headline: string | null; skills: string[] };
}

export interface ApplicationRow {
  id: string;
  status: string;
  cover_letter: string | null;
  applied_at: Date;
  job_posting: { id: string; title: string; company: { id: string; name: string } };
}

export interface ApplicantRow {
  id: string;
  status: string;
  cover_letter: string | null;
  applied_at: Date;
  worker_profile: {
    user_id: string;
    headline: string | null;
    app_user: { full_name: string };
    worker_skill: { skill: { name: string } }[];
  };
}

export function toApplicationDto(row: ApplicationRow): ApplicationDto {
  return {
    id: row.id,
    status: row.status,
    coverLetter: row.cover_letter,
    appliedAt: row.applied_at,
    job: row.job_posting,
  };
}

export function toApplicantDto(row: ApplicantRow): ApplicantDto {
  return {
    id: row.id,
    status: row.status,
    coverLetter: row.cover_letter,
    appliedAt: row.applied_at,
    worker: {
      id: row.worker_profile.user_id,
      fullName: row.worker_profile.app_user.full_name,
      headline: row.worker_profile.headline,
      skills: row.worker_profile.worker_skill.map((s) => s.skill.name),
    },
  };
}
