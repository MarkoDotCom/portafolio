import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MyApplications } from './my-applications';

const job = { id: 'j1', title: 'Frontend', company: { id: 'c1', name: 'Nortech' } };

describe('MyApplications', () => {
  it('should offer withdrawing only for non-terminal applications and call the API', async () => {
    await TestBed.configureTestingModule({
      imports: [MyApplications],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MyApplications);
    await fixture.whenStable();

    http.expectOne((r) => r.url.endsWith('/applications/mine')).flush([
      { id: 'a1', status: 'reviewing', coverLetter: null, appliedAt: '2026-09-01T00:00:00Z', job },
      { id: 'a2', status: 'rejected', coverLetter: null, appliedAt: '2026-09-01T00:00:00Z', job },
    ]);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
    const buttons = el.querySelectorAll<HTMLButtonElement>('ui-button button');
    expect(buttons).toHaveLength(1);

    buttons[0].click();
    const post = http.expectOne((r) => r.url.endsWith('/applications/a1/withdraw'));
    post.flush({ id: 'a1', status: 'withdrawn', coverLetter: null, appliedAt: '2026-09-01T00:00:00Z', job });
    await fixture.whenStable();

    expect(el.textContent).toContain('Retirada');
    expect(el.querySelectorAll('ui-button button')).toHaveLength(0);
    http.verify();
  });
});
