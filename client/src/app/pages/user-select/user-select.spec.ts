import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Session } from '../../core/session';
import type { UserSummary } from '../../core/users.api';
import { UserSelect } from './user-select';

const USERS: UserSummary[] = [
  { id: 'u1', fullName: 'Ana Rojas', email: 'ana@example.com', headline: 'Frontend', roles: ['worker'], companies: [] },
  { id: 'u3', fullName: 'Carla Muñoz', email: 'carla@example.com', headline: null, roles: ['employer'], companies: ['Nortech Labs'] },
];

describe('UserSelect', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));

    await TestBed.configureTestingModule({
      imports: [UserSelect],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.unstubAllGlobals();
  });

  async function renderWithUsers() {
    const fixture = TestBed.createComponent(UserSelect);
    await fixture.whenStable();
    http.expectOne((req) => req.url.endsWith('/users')).flush(USERS);
    await fixture.whenStable();
    return fixture;
  }

  it('should render one card per user with role tags', async () => {
    const fixture = await renderWithUsers();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('ui-profile-card')).toHaveLength(2);
    expect(el.querySelector('.ui-profile-card__subtitle')?.textContent).toBe('Frontend');
    expect(el.querySelectorAll('.ui-profile-card__subtitle')[1]?.textContent).toBe('Nortech Labs');
    expect(el.querySelectorAll('ui-tag')[1]?.textContent).toContain('Empleador');
  });

  it('should select the user and navigate to /portafolio on enter', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = await renderWithUsers();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('ui-button button')!.click();

    expect(TestBed.inject(Session).currentUser()).toEqual(USERS[0]);
    expect(navigate).toHaveBeenCalledWith('/portafolio');
  });

  it('should show an error when the API fails', async () => {
    const fixture = TestBed.createComponent(UserSelect);
    await fixture.whenStable();
    http.expectOne((req) => req.url.endsWith('/users')).flush('down', { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('.user-select__error')).toBeTruthy();
  });
});
