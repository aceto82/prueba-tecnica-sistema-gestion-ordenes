import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardService, DashboardStats } from './dashboard.service';

const MOCK_STATS: DashboardStats = {
  totalOrders: 15,
  ordersByStatus: {
    PENDING: 5,
    PROCESSING: 3,
    COMPLETED: 6,
    CANCELLED: 1,
  },
  totalRevenue: 7500,
};

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DashboardService,
      ],
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should send GET to /api/dashboard/stats', () => {
    service.getStats().subscribe((stats) => {
      expect(stats).toEqual(MOCK_STATS);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/dashboard/stats');
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_STATS);
  });

  it('should map response to DashboardStats shape', () => {
    let result: DashboardStats | undefined;

    service.getStats().subscribe((stats) => {
      result = stats;
    });

    httpMock.expectOne('http://localhost:8080/api/dashboard/stats').flush(MOCK_STATS);

    expect(result?.totalOrders).toBe(15);
    expect(result?.totalRevenue).toBe(7500);
    expect(result?.ordersByStatus['PENDING']).toBe(5);
  });

  it('should propagate HTTP errors', () => {
    let errorCaught = false;

    service.getStats().subscribe({
      next: () => fail('Expected error'),
      error: () => {
        errorCaught = true;
      },
    });

    httpMock
      .expectOne('http://localhost:8080/api/dashboard/stats')
      .flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(errorCaught).toBe(true);
  });
});
