import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';
import { Session } from './session';

describe('authInterceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
  });

  it('should add x-user-id when there is a session', () => {
    TestBed.inject(Session).select({ id: 'u1', fullName: 'Ana', email: 'a@b.c', headline: null, roles: ['worker'], companies: [] });
    TestBed.inject(HttpClient).get('/x').subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne('/x');
    expect(req.request.headers.get('x-user-id')).toBe('u1');
  });

  it('should leave the request untouched without session', () => {
    TestBed.inject(HttpClient).get('/x').subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne('/x');
    expect(req.request.headers.has('x-user-id')).toBe(false);
  });
});
