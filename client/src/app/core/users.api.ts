import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Misma forma que devuelve GET /users en services/api
export type UserRole = 'worker' | 'employer';

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  headline: string | null;
  roles: UserRole[];
  companies: { id: string; name: string; role: 'owner' | 'recruiter' }[];
}

// Cuerpo de POST /users
export interface CreateUser {
  email: string;
  fullName: string;
  role: UserRole;
  headline?: string;
  location?: string;
  openToWork?: boolean;
  companyName?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);

  list(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${environment.apiUrl}/users`);
  }

  create(user: CreateUser): Observable<UserSummary> {
    return this.http.post<UserSummary>(`${environment.apiUrl}/users`, user);
  }
}
