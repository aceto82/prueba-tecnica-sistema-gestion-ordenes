import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderStore } from './order.store';

describe('OrderStore', () => {
  let store: OrderStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    store = TestBed.inject(OrderStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('load should set orders and pagination signals', (done) => {
    store.load().subscribe({
      next: () => {
        expect(store.loading()).toBe(false);
        expect(store.orders().length).toBe(1);
        expect(store.totalElements()).toBe(1);
        expect(store.currentPage()).toBe(0);
        done();
      },
      error: done.fail,
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/orders'
    );
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.get('sort')).toBe('createdAt,desc');
    req.flush({
      content: [
        {
          id: 1,
          status: 'PENDING',
          total: 100.0,
          createdAt: '2026-05-01T10:00:00',
          customer: { id: 1, name: 'Test' },
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

  it('load with status filter should include status param', (done) => {
    store.load({ status: 'PROCESSING' }).subscribe({
      next: () => {
        expect(store.params().status).toBe('PROCESSING');
        done();
      },
      error: done.fail,
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/orders'
    );
    expect(req.request.params.get('status')).toBe('PROCESSING');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true });
  });

  it('load with page patch should update currentPage', (done) => {
    store.load({ page: 2 }).subscribe({
      next: () => {
        expect(store.currentPage()).toBe(2);
        done();
      },
      error: done.fail,
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/orders'
    );
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ content: [], totalElements: 0, totalPages: 5, number: 2, size: 20, first: false, last: false });
  });

  it('create should prepend new order', (done) => {
    store.create({ customerId: 1, total: 200.0 }).subscribe({
      next: (order) => {
        expect(order.id).toBe(2);
        expect(store.orders().length).toBe(1);
        expect(store.orders()[0].total).toBe(200.0);
        done();
      },
      error: done.fail,
    });

    const req = httpMock.expectOne('http://localhost:8080/api/orders');
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 2,
      status: 'PENDING',
      total: 200.0,
      createdAt: '2026-05-08T12:00:00',
      customer: { id: 1, name: 'Test' },
    });
  });

  it('update should replace the matching order in the signal', (done) => {
    // Seed orders via load first
    store.load().subscribe();
    const loadReq = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/orders'
    );
    loadReq.flush({
      content: [
        {
          id: 1,
          status: 'PENDING',
          total: 100.0,
          createdAt: '2026-05-01T10:00:00',
          customer: { id: 1, name: 'Test' },
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    // Now call update
    store.update(1, { status: 'PROCESSING' }).subscribe({
      next: (updated) => {
        expect(updated.status).toBe('PROCESSING');
        expect(store.orders().length).toBe(1);
        expect(store.orders()[0].status).toBe('PROCESSING');
        done();
      },
      error: done.fail,
    });

    const updateReq = httpMock.expectOne('http://localhost:8080/api/orders/1');
    expect(updateReq.request.method).toBe('PUT');
    updateReq.flush({
      id: 1,
      status: 'PROCESSING',
      total: 100.0,
      createdAt: '2026-05-01T10:00:00',
      customer: { id: 1, name: 'Test' },
    });
  });
});
