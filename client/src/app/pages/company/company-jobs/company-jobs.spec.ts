import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Session } from '../../../core/session';
import { CompanyJobs } from './company-jobs';

const draft = {
  id: 'j1', title: 'Frontend', description: '', company: { id: 'c1', name: 'Nortech' }, employmentType: 'full_time',
  workMode: 'remote', location: null, salaryMin: null, salaryMax: null, salaryCurrency: null, status: 'draft',
  publishedAt: null, skills: [], applicationsCount: 2,
};

describe('CompanyJobs', () => {
  it('should list the company jobs and publish a draft', async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyJobs],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    TestBed.inject(Session).select({
      id: 'u4', fullName: 'Diego', email: 'd@b.c', headline: null, roles: ['employer'],
      companies: [{ id: 'c1', name: 'Nortech', role: 'recruiter' }],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(CompanyJobs);
    await fixture.whenStable();

    http.expectOne((r) => r.url.endsWith('/companies/c1/jobs')).flush([draft]);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(el.textContent).toContain('Borrador');
    expect(el.textContent).toContain('2 postulantes');

    el.querySelector<HTMLButtonElement>('ui-button button')!.click();
    const patch = http.expectOne((r) => r.url.endsWith('/jobs/j1/status'));
    expect(patch.request.body).toEqual({ status: 'published' });
    patch.flush({ ...draft, status: 'published' });
    await fixture.whenStable();

    expect(el.textContent).toContain('Publicada');
    expect(el.querySelector('ui-button button')?.textContent).toContain('Cerrar');
    http.verify();
  });
});
