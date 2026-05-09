import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AuthStore } from './auth.store';

// A real-looking fake JWT with payload {"sub":"admin","role":"ADMIN"}
// header:  {"alg":"HS256","typ":"JWT"}  -> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
// payload: {"sub":"admin","role":"ADMIN"} -> eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJBRE1JTiJ9
// signature: fakeSignatureForTesting
const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJBRE1JTiJ9.' +
  'fakeSignatureForTesting';

describe('AuthStore', () => {
  let authStore: AuthStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    authStore = TestBed.inject(AuthStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('isAuthenticated should return false initially', () => {
    expect(authStore.isAuthenticated()).toBe(false);
  });

  it('login should set token and currentUser on success', (done) => {
    authStore.login({ username: 'admin', password: 'admin123' }).subscribe({
      next: () => {
        expect(authStore.isAuthenticated()).toBe(true);
        expect(authStore.token()).toBe(FAKE_JWT);
        expect(authStore.currentUser()?.username).toBe('admin');
        expect(authStore.currentUser()?.role).toBe('ADMIN');
        done();
      },
      error: done.fail,
    });

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ token: FAKE_JWT });
  });

  it('login should not set token on HTTP error', (done) => {
    authStore.login({ username: 'wrong', password: 'wrongpass' }).subscribe({
      next: () => done.fail('Expected error'),
      error: () => {
        expect(authStore.isAuthenticated()).toBe(false);
        expect(authStore.token()).toBeNull();
        done();
      },
    });

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    req.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('rehydrate should restore state from localStorage', () => {
    localStorage.setItem('auth_token', FAKE_JWT);

    authStore.rehydrate();

    expect(authStore.isAuthenticated()).toBe(true);
    expect(authStore.token()).toBe(FAKE_JWT);
    expect(authStore.currentUser()?.username).toBe('admin');
  });

  it('logout should clear token and currentUser', (done) => {
    authStore.login({ username: 'admin', password: 'admin123' }).subscribe({
      next: () => {
        authStore.logout();
        expect(authStore.isAuthenticated()).toBe(false);
        expect(authStore.token()).toBeNull();
        expect(authStore.currentUser()).toBeNull();
        expect(localStorage.getItem('auth_token')).toBeNull();
        done();
      },
      error: done.fail,
    });

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    req.flush({ token: FAKE_JWT });
  });
});
