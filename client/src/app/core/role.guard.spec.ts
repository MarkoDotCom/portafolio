import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { Session } from './session';

describe('roleGuard', () => {
  const run = (role: 'worker' | 'employer') =>
    TestBed.runInInjectionContext(() => roleGuard(role)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('should allow a user with the role and redirect one without it to their home', () => {
    TestBed.inject(Session).select({ id: 'u3', fullName: 'Carla', email: 'c@b.c', headline: null, roles: ['employer'], companies: [] });
    expect(run('employer')).toBe(true);
    expect(run('worker').toString()).toBe('/empresa/ofertas');
  });

  it('should redirect to / without session', () => {
    expect(run('worker').toString()).toBe('/');
  });
});
