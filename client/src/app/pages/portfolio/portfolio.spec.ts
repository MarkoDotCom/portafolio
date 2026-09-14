import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import type { WorkerPortfolio } from '../../core/workers.api';
import { Portfolio } from './portfolio';

const PORTFOLIO: WorkerPortfolio = {
  id: 'u1', slug: 'ana', fullName: 'Ana Rojas', email: 'ana@example.com', avatarUrl: null, headline: 'Frontend Engineer',
  summary: 'Resumen', location: 'Santiago', isPublic: true, openToWork: true,
  socialLinks: [{ platform: 'github', url: 'https://github.com/ana' }],
  skills: [
    { id: 's1', name: 'Angular', category: 'framework', level: 5 },
    { id: 's2', name: 'Comunicación', category: 'soft_skill', level: null },
  ],
  experience: [{ id: 'e1', title: 'Senior Frontend', companyName: 'Agencia Pixel', companyId: null, employmentType: 'full_time', workMode: 'remote', location: null, startDate: '2022-03-01', endDate: null, description: null, skills: ['Angular'] }],
  education: [{ id: 'ed1', institution: 'U. de Chile', degree: 'Ingeniería', fieldOfStudy: null, startDate: '2014-03-01', endDate: '2019-01-31', description: null }],
  certifications: [{ id: 'c1', name: 'WAS', issuer: 'IAAP', issuedAt: '2023-05-10', expiresAt: null, credentialId: null, credentialUrl: 'https://iaap.example.com' }],
  projects: [{ id: 'p1', slug: 'ui-kit', title: 'UI Kit', summary: 'Librería', description: null, repoUrl: 'https://github.com/ana/ui-kit', demoUrl: null, coverUrl: null, startedAt: null, endedAt: null, isFeatured: true, skills: ['Angular'] }],
};

describe('Portfolio', () => {
  let http: HttpTestingController;

  async function configure(routeId: string | null) {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    await TestBed.configureTestingModule({
      imports: [Portfolio],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(routeId ? { id: routeId } : {}) } } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    http.verify();
    vi.unstubAllGlobals();
  });

  it('should render every section of the own portfolio', async () => {
    await configure(null);
    const fixture = TestBed.createComponent(Portfolio);
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/workers/me')).flush(PORTFOLIO);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const text = el.textContent ?? '';
    expect(el.querySelector('.ui-profile-card__name')?.textContent).toBe('Ana Rojas');
    expect(text).toContain('Disponible para trabajar');
    expect(el.querySelectorAll('ui-progress-bar')).toHaveLength(1); // Angular con nivel
    expect(text).toContain('Comunicación'); // sin nivel, como tag
    expect(text).toContain('Agencia Pixel');
    expect(text).toContain('actualidad');
    expect(text).toContain('U. de Chile');
    expect(text).toContain('Ver credencial');
    expect(text).toContain('UI Kit');
    expect(text).toContain('Destacado');
    expect(el.querySelector('a[href="mailto:ana@example.com"]')).toBeTruthy();
    expect(el.querySelectorAll('ui-sidebar a')).toHaveLength(6);
  });

  it('should load another worker by route id', async () => {
    await configure('u2');
    const fixture = TestBed.createComponent(Portfolio);
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/workers/u2')).flush(PORTFOLIO);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ana Rojas');
  });

  it('should explain when the user has no worker profile', async () => {
    await configure(null);
    const fixture = TestBed.createComponent(Portfolio);
    await fixture.whenStable();
    http.expectOne((r) => r.url.endsWith('/workers/me')).flush('no', { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('no tiene perfil de trabajador');
  });
});
