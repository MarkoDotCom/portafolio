import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { ApplicationsApi } from './applications.api';

describe('ApplicationsApi', () => {
  let api: ApplicationsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ApplicationsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should apply with an optional cover letter', () => {
    api.apply('j1', 'Hola').subscribe();
    expect(http.expectOne(`${environment.apiUrl}/jobs/j1/applications`).request.body).toEqual({ coverLetter: 'Hola' });
    api.apply('j1').subscribe();
    expect(http.expectOne(`${environment.apiUrl}/jobs/j1/applications`).request.body).toEqual({});
  });

  it('should withdraw and change status', () => {
    api.withdraw('a1').subscribe();
    expect(http.expectOne(`${environment.apiUrl}/applications/a1/withdraw`).request.method).toBe('POST');
    api.updateStatus('a1', 'reviewing', 'ok').subscribe();
    expect(http.expectOne(`${environment.apiUrl}/applications/a1/status`).request.body).toEqual({ status: 'reviewing', note: 'ok' });
  });
});
