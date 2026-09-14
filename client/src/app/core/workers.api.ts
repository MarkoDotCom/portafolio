import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Forma de GET /workers/me y /workers/:id (fechas como ISO string)
export interface WorkerSkill {
  id: string;
  name: string;
  category: string;
  level: number | null;
}

export interface WorkerExperience {
  id: string;
  title: string;
  companyName: string;
  companyId: string | null;
  employmentType: string | null;
  workMode: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
  skills: string[];
}

export interface WorkerEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

export interface WorkerCertification {
  id: string;
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
}

export interface WorkerProject {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  coverUrl: string | null;
  startedAt: string | null;
  endedAt: string | null;
  isFeatured: boolean;
  skills: string[];
}

export interface WorkerPortfolio {
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
  skills: WorkerSkill[];
  experience: WorkerExperience[];
  education: WorkerEducation[];
  certifications: WorkerCertification[];
  projects: WorkerProject[];
}

@Injectable({ providedIn: 'root' })
export class WorkersApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  me(): Observable<WorkerPortfolio> {
    return this.http.get<WorkerPortfolio>(`${this.base}/workers/me`);
  }

  get(id: string): Observable<WorkerPortfolio> {
    return this.http.get<WorkerPortfolio>(`${this.base}/workers/${id}`);
  }
}
