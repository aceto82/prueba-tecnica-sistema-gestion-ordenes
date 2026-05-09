import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CustomerStore } from './customer.store';

describe('CustomerStore', () => {
  let store: CustomerStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    store = TestBed.inject(CustomerStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('load should set customers and pagination signals', (done) => {
    store.load().subscribe({
      next: () => {
        expect(store.loading()).toBe(false);
        expect(store.customers().length).toBe(2);
        expect(store.totalElements()).toBe(2);
        expect(store.totalPages()).toBe(1);
        expect(store.currentPage()).toBe(0);
        done();
      },
      error: done.fail,
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/customers'
    );
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush({
      content: [
        { id: 1, name: 'Alpha', email: 'alpha@test.com' },
        { id: 2, name: 'Beta', email: 'beta@test.com' },
      ],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });
  });

  it('load should set error signal on failure', (done) => {
    store.load().subscribe({
      next: () => done.fail('Expected error'),
      error: () => {
        expect(store.loading()).toBe(false);
        expect(store.error()).toBeTruthy();
        expect(store.customers().length).toBe(0);
        done();
      },
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/customers'
    );
    req.flush({ detail: 'Server error' }, { status: 500, statusText: 'Server Error' });
  });

  it('create should prepend new customer to list', (done) => {
    store.create({ name: 'New', email: 'new@test.com' }).subscribe({
      next: (customer) => {
        expect(customer.id).toBe(3);
        expect(store.customers().length).toBe(1);
        expect(store.customers()[0].name).toBe('New');
        done();
      },
      error: done.fail,
    });

    const req = httpMock.expectOne('http://localhost:8080/api/customers');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 3, name: 'New', email: 'new@test.com' });
  });

  it('update should replace customer in list and selected', (done) => {
    // First load some customers
    store.load().subscribe();
    const loadReq = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/customers'
    );
    loadReq.flush({
      content: [{ id: 1, name: 'Old', email: 'old@test.com' }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
    });

    // Now update
    store.update(1, { name: 'Updated', email: 'updated@test.com' }).subscribe({
      next: () => {
        expect(store.customers()[0].name).toBe('Updated');
        done();
      },
      error: done.fail,
    });

    const updateReq = httpMock.expectOne('http://localhost:8080/api/customers/1');
    expect(updateReq.request.method).toBe('PUT');
    updateReq.flush({ id: 1, name: 'Updated', email: 'updated@test.com' });
  });
});
