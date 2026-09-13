import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Session } from '../../core/session';
import { Portfolio } from './portfolio';

describe('Portfolio', () => {
  beforeEach(async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });

    await TestBed.configureTestingModule({
      imports: [Portfolio],
      providers: [provideRouter([])],
    }).compileComponents();

    TestBed.inject(Session).select({
      id: 'u1',
      fullName: 'Ana Rojas',
      email: 'ana@example.com',
      headline: 'Frontend Engineer',
      roles: ['worker'],
      companies: [],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render the theme toggle', async () => {
    const fixture = TestBed.createComponent(Portfolio);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('ui-theme-toggle button')).toBeTruthy();
  });

  it('should show the current user in the header and profile card', async () => {
    const fixture = TestBed.createComponent(Portfolio);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-header__brand')?.textContent).toBe('Ana Rojas');
    expect(compiled.querySelector('.ui-profile-card__name')?.textContent).toBe('Ana Rojas');
    expect(compiled.querySelector('.ui-profile-card__subtitle')?.textContent).toBe('Frontend Engineer');
    expect(compiled.querySelector('.app-header__switch')?.getAttribute('href')).toBe('/');
  });
});
