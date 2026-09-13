import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Formas que devuelve services/api (jobs, skills)
export type JobStatus = 'draft' | 'published' | 'closed';

export interface JobSkill {
  id: string;
  name: string;
  required: boolean;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  company: { id: string; name: string };
  employmentType: string;
  workMode: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  status: JobStatus;
  publishedAt: string | null;
  skills: JobSkill[];
  applicationsCount: number;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface CreateJob {
  companyId: string;
  title: string;
  description: string;
  employmentType: string;
  workMode: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  skills: { skillId: string; required: boolean }[];
}

@Injectable({ providedIn: 'root' })
export class JobsApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listPublished(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.base}/jobs`);
  }

  get(id: string): Observable<Job> {
    return this.http.get<Job>(`${this.base}/jobs/${id}`);
  }

  listForCompany(companyId: string): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.base}/companies/${companyId}/jobs`);
  }

  create(job: CreateJob): Observable<Job> {
    return this.http.post<Job>(`${this.base}/jobs`, job);
  }

  updateStatus(id: string, status: 'published' | 'closed'): Observable<Job> {
    return this.http.patch<Job>(`${this.base}/jobs/${id}/status`, { status });
  }

  skills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.base}/skills`);
  }
}
