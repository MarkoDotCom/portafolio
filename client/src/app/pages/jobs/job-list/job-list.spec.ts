import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { JobList } from './job-list';

describe('JobList', () => {
  it('should render a card per published job', async () => {
    await TestBed.configureTestingModule({
      imports: [JobList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(JobList);
    await fixture.whenStable();

    TestBed.inject(HttpTestingController).expectOne((r) => r.url.endsWith('/jobs')).flush([
      {
        id: 'j1', title: 'Frontend', description: '', company: { id: 'c1', name: 'Nortech' }, employmentType: 'full_time',
        workMode: 'remote', location: null, salaryMin: 1000000, salaryMax: 2000000, salaryCurrency: 'CLP', status: 'published',
        publishedAt: null, skills: [{ id: 's1', name: 'Angular', required: true }], applicationsCount: 0,
      },
    ]);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('ui-card')).toHaveLength(1);
    expect(el.textContent).toContain('Nortech');
    expect(el.textContent).toContain('Remoto');
    expect(el.querySelector('.job-list__salary')?.textContent).toContain('CLP');
    expect(el.querySelector('.job-list__link')?.getAttribute('href')).toBe('/ofertas/j1');
  });
});
