import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Session } from '../../../core/session';
import { JobForm } from './job-form';

function type(el: HTMLElement, selector: string, value: string) {
  const input = el.querySelector<HTMLInputElement>(selector)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('JobForm', () => {
  it('should post the job with the selected skills and go back to the list', async () => {
    await TestBed.configureTestingModule({
      imports: [JobForm],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    TestBed.inject(Session).select({
      id: 'u4', fullName: 'Diego', email: 'd@b.c', headline: null, roles: ['employer'],
      companies: [{ id: 'c1', name: 'Nortech', role: 'recruiter' }],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(JobForm);
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/skills')).flush([{ id: 's1', name: 'Angular', category: 'framework' }]);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    type(el, 'input[formControlName="title"]', 'Frontend');
    type(el, 'textarea[formControlName="description"]', 'Descripción suficientemente larga');
    const skillCheckbox = el.querySelector<HTMLInputElement>('.job-form__skill input[type="checkbox"]')!;
    skillCheckbox.checked = true;
    skillCheckbox.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();

    const post = http.expectOne((r) => r.url.endsWith('/jobs'));
    expect(post.request.body).toEqual({
      companyId: 'c1', title: 'Frontend', description: 'Descripción suficientemente larga', employmentType: 'full_time',
      workMode: 'hybrid', skills: [{ skillId: 's1', required: true }],
    });
    post.flush({});
    expect(navigate).toHaveBeenCalledWith('/empresa/ofertas');
    http.verify();
  });
});
