import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Session } from './session';
import { sessionGuard } from './session.guard';

describe('sessionGuard', () => {
  const run = () =>
    TestBed.runInInjectionContext(() => sessionGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('should allow navigation when a user is selected', () => {
    TestBed.inject(Session).select({ id: 'u1', fullName: 'Ana', email: 'a@b.c', headline: null, roles: ['worker'], companies: [] });
    expect(run()).toBe(true);
  });

  it('should redirect to / when no user is selected', () => {
    const result = run();
    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toBe('/');
  });
});
