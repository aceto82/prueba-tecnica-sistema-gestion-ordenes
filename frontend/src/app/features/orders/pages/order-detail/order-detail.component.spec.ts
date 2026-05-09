import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { OrderDetailComponent } from './order-detail.component';
import { OrderStore } from '../../order.store';

function makeOrderStoreMock() {
  return {
    orders: signal([]).asReadonly(),
    loading: signal(false).asReadonly(),
    error: signal<string | null>(null).asReadonly(),
    params: signal({ page: 0, size: 20, sort: 'createdAt,desc' }).asReadonly(),
    totalElements: signal(0).asReadonly(),
    totalPages: signal(0).asReadonly(),
    currentPage: computed(() => 0),
    hasNext: computed(() => false),
    isEmpty: computed(() => true),
    selected: signal(null).asReadonly(),
    load: jest.fn(() => of(void 0)),
    selectById: jest.fn(() => of(void 0)),
    create: jest.fn(),
    update: jest.fn(),
  };
}

describe('OrderDetailComponent (smoke)', () => {
  let fixture: ComponentFixture<OrderDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetailComponent, RouterTestingModule],
      providers: [
        { provide: OrderStore, useValue: makeOrderStoreMock() },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailComponent);
    fixture.detectChanges();
  });

  it('should render without errors', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should show nothing when no order is selected and not loading', () => {
    // With selected=null and loading=false, neither loading overlay nor detail card renders
    const loadingOverlay = fixture.nativeElement.querySelector('.loading-overlay');
    const detailCard = fixture.nativeElement.querySelector('.detail-card');
    expect(loadingOverlay).toBeNull();
    expect(detailCard).toBeNull();
  });
});
