import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardStore } from './dashboard.store';

const MOCK_STATS = {
  totalOrders: 10,
  ordersByStatus: {
    PENDING: 3,
    PROCESSING: 4,
    COMPLETED: 2,
    CANCELLED: 1
  },
  totalRevenue: 5000
};

describe('DashboardStore', () => {
  let store: DashboardStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    store = TestBed.inject(DashboardStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(store).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(store.stats()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should load stats from API', (done) => {
    store.loadStats();

    const req = httpMock.expectOne('http://localhost:8080/api/dashboard/stats');
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_STATS);

    // Wait for observable to complete
    setTimeout(() => {
      expect(store.stats()).toEqual(MOCK_STATS);
      expect(store.loading()).toBe(false);
      expect(store.totalOrders()).toBe(10);
      expect(store.totalRevenue()).toBe(5000);
      expect(store.pendingCount()).toBe(3);
      expect(store.processingCount()).toBe(4);
      expect(store.completedCount()).toBe(2);
      done();
    }, 100);
  });

  it('should handle error on loadStats failure', (done) => {
    store.loadStats();

    const req = httpMock.expectOne('http://localhost:8080/api/dashboard/stats');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    setTimeout(() => {
      expect(store.error()).toBe('Failed to load dashboard stats');
      expect(store.loading()).toBe(false);
      done();
    }, 100);
  });
});