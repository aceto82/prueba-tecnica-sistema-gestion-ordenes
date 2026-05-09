import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { OrderService } from './order.service';
import { jwtInterceptor } from '../interceptors/jwt.interceptor';
import { AuthStore } from '../../features/auth/auth.store';
import { signal } from '@angular/core';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        OrderService,
        {
          provide: AuthStore,
          useValue: { token: signal<string | null>('test-token').asReadonly() },
        },
      ],
    });

    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list orders with pagination params', () => {
    service.list(0, 20).subscribe((page) => {
      expect(page.content.length).toBe(1);
      expect(page.totalElements).toBe(1);
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/orders'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.get('sort')).toBe('createdAt,desc');
    req.flush({
      content: [
        {
          id: 1,
          status: 'PENDING',
          total: 150.0,
          createdAt: '2026-05-01T10:00:00',
          customer: { id: 1, name: 'Test Corp' },
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });
  });

  it('should list orders with optional filter params', () => {
    service.list(0, 20, 'createdAt,desc', 'PENDING', '2026-05-01', '2026-05-08', 'Test').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/orders'
    );
    expect(req.request.params.get('status')).toBe('PENDING');
    expect(req.request.params.get('dateFrom')).toBe('2026-05-01');
    expect(req.request.params.get('dateTo')).toBe('2026-05-08');
    expect(req.request.params.get('customerName')).toBe('Test');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true });
  });

  it('should get order by id', () => {
    service.getById(1).subscribe((order) => {
      expect(order.id).toBe(1);
      expect(order.customer.name).toBe('Test Corp');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/orders/1');
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 1,
      status: 'PENDING',
      total: 150.0,
      createdAt: '2026-05-01T10:00:00',
      customer: { id: 1, name: 'Test Corp' },
    });
  });

  it('should create an order', () => {
    service.create({ customerId: 1, total: 250.0 }).subscribe((order) => {
      expect(order.id).toBe(2);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/orders');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ customerId: 1, total: 250.0 });
    req.flush({
      id: 2,
      status: 'PENDING',
      total: 250.0,
      createdAt: '2026-05-08T12:00:00',
      customer: { id: 1, name: 'Test Corp' },
    });
  });

  it('should update an order', () => {
    service.update(1, { status: 'PROCESSING' }).subscribe((order) => {
      expect(order.status).toBe('PROCESSING');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/orders/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ status: 'PROCESSING' });
    req.flush({
      id: 1,
      status: 'PROCESSING',
      total: 150.0,
      createdAt: '2026-05-01T10:00:00',
      customer: { id: 1, name: 'Test Corp' },
    });
  });
});
