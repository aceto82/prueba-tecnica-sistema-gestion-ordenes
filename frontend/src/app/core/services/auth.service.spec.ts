import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should send POST to /api/auth/login with credentials', () => {
    service.login('alice', 'secret').subscribe((resp) => {
      expect(resp.token).toBe('jwt.token.here');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'alice', password: 'secret' });
    req.flush({ token: 'jwt.token.here' });
  });

  it('should return the token string from the response', () => {
    let result: { token: string } | undefined;

    service.login('admin', 'admin123').subscribe((resp) => {
      result = resp;
    });

    httpMock
      .expectOne('http://localhost:8080/api/auth/login')
      .flush({ token: 'eyJhbGciOiJIUzI1NiJ9.payload.signature' });

    expect(result?.token).toBe('eyJhbGciOiJIUzI1NiJ9.payload.signature');
  });

  it('should propagate 401 error on wrong credentials', () => {
    let errorCaught = false;

    service.login('wrong', 'badpass').subscribe({
      next: () => fail('Expected error'),
      error: () => {
        errorCaught = true;
      },
    });

    httpMock
      .expectOne('http://localhost:8080/api/auth/login')
      .flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(errorCaught).toBe(true);
  });

  it('should expose the API base URL via getApiUrl()', () => {
    expect(service.getApiUrl()).toBe('http://localhost:8080');
  });
});
