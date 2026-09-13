import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { JobsApi } from './jobs.api';

describe('JobsApi', () => {
  let api: JobsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(JobsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should list published jobs', () => {
    api.listPublished().subscribe();
    expect(http.expectOne(`${environment.apiUrl}/jobs`).request.method).toBe('GET');
  });

  it('should create a job and change its status', () => {
    api.create({ companyId: 'c1', title: 'T', description: 'D', employmentType: 'contract', workMode: 'remote', skills: [] }).subscribe();
    const post = http.expectOne(`${environment.apiUrl}/jobs`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toMatchObject({ companyId: 'c1', title: 'T' });

    api.updateStatus('j1', 'published').subscribe();
    const patch = http.expectOne(`${environment.apiUrl}/jobs/j1/status`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ status: 'published' });
  });
});
