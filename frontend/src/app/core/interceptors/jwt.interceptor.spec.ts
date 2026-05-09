import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Signal, signal } from '@angular/core';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthStore } from '../../features/auth/auth.store';

// Typed mock for AuthStore — only the fields jwtInterceptor reads
interface AuthStoreMock {
  token: Signal<string | null>;
}

describe('jwtInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;

  function setupWith(tokenValue: string | null): void {
    const tokenSignal = signal<string | null>(tokenValue);

    const mockStore: AuthStoreMock = {
      token: tokenSignal.asReadonly(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: mockStore },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach Authorization header when token exists', () => {
    setupWith('test-token');

    http.get('/api/orders').subscribe();

    const req = httpMock.expectOne('/api/orders');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush([]);
  });

  it('should attach Authorization header for login request when token exists', () => {
    setupWith('test-token');

    http.post('/api/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({ token: 'some-token' });
  });

  it('should NOT attach header when token is null', () => {
    setupWith(null);

    http.get('/api/orders').subscribe();

    const req = httpMock.expectOne('/api/orders');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});
