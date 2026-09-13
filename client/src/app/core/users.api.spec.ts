import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { UsersApi } from './users.api';

describe('UsersApi', () => {
  it('should GET the users from the API', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const users = [{ id: 'u1', fullName: 'Ana', email: 'ana@example.com', headline: null, roles: [], companies: [] }];

    let result: unknown;
    TestBed.inject(UsersApi).list().subscribe((r) => (result = r));

    const req = http.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.method).toBe('GET');
    req.flush(users);
    expect(result).toEqual(users);
    http.verify();
  });
});
