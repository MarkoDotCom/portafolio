import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { JobDetail } from './job-detail';

const JOB = {
  id: 'j1', title: 'Frontend', description: 'Desc', company: { id: 'c1', name: 'Nortech' }, employmentType: 'full_time',
  workMode: 'remote', location: null, salaryMin: null, salaryMax: null, salaryCurrency: null, status: 'published',
  publishedAt: null, skills: [], applicationsCount: 0,
};

describe('JobDetail', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'j1' }) } } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should let the worker apply and then show the application status', async () => {
    const fixture = TestBed.createComponent(JobDetail);
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/jobs/j1')).flush(JOB);
    http.expectOne((r) => r.url.endsWith('/applications/mine')).flush([]);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Postular');
    el.querySelector<HTMLButtonElement>('ui-button button')!.click();

    const post = http.expectOne((r) => r.url.endsWith('/jobs/j1/applications'));
    expect(post.request.method).toBe('POST');
    post.flush({ id: 'a1', status: 'applied', coverLetter: null, appliedAt: '', job: { id: 'j1', title: 'Frontend', company: JOB.company } });
    await fixture.whenStable();

    expect(el.textContent).toContain('Tu postulación');
    expect(el.textContent).toContain('Postulado');
  });

  it('should show the existing application instead of the form', async () => {
    const fixture = TestBed.createComponent(JobDetail);
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/jobs/j1')).flush(JOB);
    http.expectOne((r) => r.url.endsWith('/applications/mine')).flush([
      { id: 'a1', status: 'interview', coverLetter: null, appliedAt: '', job: { id: 'j1', title: 'Frontend', company: JOB.company } },
    ]);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('textarea')).toBeNull();
    expect(el.textContent).toContain('Entrevista');
  });
});
