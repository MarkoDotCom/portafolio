import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ApplicationStatus = 'applied' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
export type EmployerStatusTarget = 'reviewing' | 'interview' | 'offer' | 'rejected';

// Vista del trabajador
export interface Application {
  id: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  appliedAt: string;
  job: { id: string; title: string; company: { id: string; name: string } };
}

// Vista del empleador
export interface Applicant {
  id: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  appliedAt: string;
  worker: { id: string; fullName: string; headline: string | null; skills: string[] };
}

@Injectable({ providedIn: 'root' })
export class ApplicationsApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  apply(jobId: string, coverLetter?: string): Observable<Application> {
    return this.http.post<Application>(`${this.base}/jobs/${jobId}/applications`, coverLetter ? { coverLetter } : {});
  }

  mine(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.base}/applications/mine`);
  }

  withdraw(id: string): Observable<Application> {
    return this.http.post<Application>(`${this.base}/applications/${id}/withdraw`, {});
  }

  forJob(jobId: string): Observable<Applicant[]> {
    return this.http.get<Applicant[]>(`${this.base}/jobs/${jobId}/applications`);
  }

  updateStatus(id: string, status: EmployerStatusTarget, note?: string): Observable<Applicant> {
    return this.http.patch<Applicant>(`${this.base}/applications/${id}/status`, note ? { status, note } : { status });
  }
}
