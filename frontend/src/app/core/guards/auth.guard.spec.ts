import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Signal, computed, signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthStore } from '../../features/auth/auth.store';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

// Typed mock for AuthStore — only the fields authGuard reads
interface AuthStoreMock {
  isAuthenticated: Signal<boolean>;
}

function makeAuthStoreMock(authenticated: boolean): AuthStoreMock {
  const _token = signal<string | null>(authenticated ? 'some-token' : null);
  return {
    isAuthenticated: computed(() => _token() !== null),
  };
}

describe('authGuard', () => {
  let router: Router;

  function setupWith(authenticated: boolean): void {
    const mockStore = makeAuthStoreMock(authenticated);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthStore, useValue: mockStore }],
    });

    router = TestBed.inject(Router);
  }

  it('should return true when user is authenticated', () => {
    setupWith(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );

    expect(result).toBe(true);
  });

  it('should return false and redirect to /login when not authenticated', () => {
    setupWith(false);

    const navigateSpy = jest.spyOn(router, 'navigate');

    const result = TestBed.runInInjectionContext(() =>
      authGuard(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );

    expect(result).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
