import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Session } from '../../core/session';
import { Shell } from './shell';

describe('Shell', () => {
  beforeEach(async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    await TestBed.configureTestingModule({ imports: [Shell], providers: [provideRouter([])] }).compileComponents();
  });

  afterEach(() => vi.unstubAllGlobals());

  async function navLinks(roles: ('worker' | 'employer')[]) {
    TestBed.inject(Session).select({ id: 'u1', fullName: 'Ana', email: 'a@b.c', headline: null, roles, companies: [] });
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    return [...(fixture.nativeElement as HTMLElement).querySelectorAll('.shell__nav a')].map((a) => a.textContent?.trim());
  }

  it('should show worker links for a worker', async () => {
    expect(await navLinks(['worker'])).toEqual(['Ofertas', 'Mis postulaciones', 'Mi portafolio']);
  });

  it('should show company links for an employer', async () => {
    expect(await navLinks(['employer'])).toEqual(['Ofertas de mi empresa']);
  });
});
