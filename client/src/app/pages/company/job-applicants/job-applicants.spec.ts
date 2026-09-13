import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { JobApplicants } from './job-applicants';

const applicant = {
  id: 'a1', status: 'applied', coverLetter: 'Hola', appliedAt: '2026-09-01T00:00:00Z',
  worker: { id: 'u2', fullName: 'Bruno Díaz', headline: 'Backend', skills: ['Node.js'] },
};

describe('JobApplicants', () => {
  it('should offer the valid transitions and send the chosen one with a note', async () => {
    await TestBed.configureTestingModule({
      imports: [JobApplicants],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'j1' }) } } },
      ],
    }).compileComponents();
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(JobApplicants);
    await fixture.whenStable();

    http.expectOne((r) => r.url.endsWith('/jobs/j1')).flush({ id: 'j1', title: 'Frontend', skills: [], company: { id: 'c1', name: 'Nortech' } });
    http.expectOne((r) => r.url.endsWith('/jobs/j1/applications')).flush([applicant]);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const buttons = [...el.querySelectorAll<HTMLButtonElement>('ui-button button')];
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['En revisión', 'Rechazado']);

    el.querySelector<HTMLInputElement>('input.ui-input')!.value = 'Buen perfil';
    buttons[0].click();

    const patch = http.expectOne((r) => r.url.endsWith('/applications/a1/status'));
    expect(patch.request.body).toEqual({ status: 'reviewing', note: 'Buen perfil' });
    patch.flush({ ...applicant, status: 'reviewing' });
    await fixture.whenStable();

    expect([...el.querySelectorAll('ui-button button')].map((b) => b.textContent?.trim())).toEqual(['Entrevista', 'Rechazado']);
    http.verify();
  });
});
