import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, computed } from '@angular/core';
import { DashboardComponent } from './dashboard.component';
import { DashboardStore } from './dashboard.store';

// Mock chart.js/auto to avoid canvas rendering in jsdom
jest.mock('chart.js/auto', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      destroy: jest.fn(),
      update: jest.fn(),
    })),
  };
});

function makeDashboardStoreMock() {
  return {
    stats: signal<null>(null).asReadonly(),
    loading: signal(false).asReadonly(),
    error: signal<string | null>(null).asReadonly(),
    totalOrders: computed(() => 0),
    totalRevenue: computed(() => 0),
    pendingCount: computed(() => 0),
    processingCount: computed(() => 0),
    completedCount: computed(() => 0),
    loadStats: jest.fn(),
  };
}

describe('DashboardComponent (smoke)', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let storeMock: ReturnType<typeof makeDashboardStoreMock>;

  beforeEach(async () => {
    storeMock = makeDashboardStoreMock();

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: DashboardStore, useValue: storeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('should render without errors', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should display the Dashboard heading', () => {
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent?.trim()).toBe('Dashboard');
  });

  it('should call loadStats on init', () => {
    expect(storeMock.loadStats).toHaveBeenCalled();
  });
});
