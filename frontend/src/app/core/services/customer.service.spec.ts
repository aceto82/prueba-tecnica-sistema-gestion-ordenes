import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { CustomerService } from './customer.service';
import { jwtInterceptor } from '../interceptors/jwt.interceptor';
import { AuthStore } from '../../features/auth/auth.store';
import { signal } from '@angular/core';

describe('CustomerService', () => {
  let service: CustomerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        CustomerService,
        {
          provide: AuthStore,
          useValue: { token: signal<string | null>('test-token').asReadonly() },
        },
      ],
    });

    service = TestBed.inject(CustomerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list customers with pagination params', () => {
    service.list(0, 20, 'name,asc').subscribe((page) => {
      expect(page.content.length).toBe(1);
      expect(page.content[0].name).toBe('Test Corp');
      expect(page.totalElements).toBe(1);
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/customers'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.get('sort')).toBe('name,asc');
    req.flush({ content: [{ id: 1, name: 'Test Corp', email: 'test@corp.com' }], totalElements: 1, totalPages: 1, number: 0, size: 20, first: true, last: true });
  });

  it('should get customer by id', () => {
    service.getById(1).subscribe((customer) => {
      expect(customer.name).toBe('Test Corp');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/customers/1');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 1, name: 'Test Corp', email: 'test@corp.com' });
  });

  it('should create a customer', () => {
    service.create({ name: 'New Co', email: 'new@co.com' }).subscribe((customer) => {
      expect(customer.id).toBe(2);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/customers');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'New Co', email: 'new@co.com' });
    req.flush({ id: 2, name: 'New Co', email: 'new@co.com' });
  });

  it('should update a customer', () => {
    service.update(1, { name: 'Updated', email: 'updated@corp.com' }).subscribe((customer) => {
      expect(customer.name).toBe('Updated');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/customers/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Updated', email: 'updated@corp.com' });
    req.flush({ id: 1, name: 'Updated', email: 'updated@corp.com' });
  });
});
