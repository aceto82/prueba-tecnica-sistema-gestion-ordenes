import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { OrderFormComponent } from './order-form.component';
import { OrderStore } from '../../order.store';
import { CustomerService } from '../../../../core/services/customer.service';

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
    create: jest.fn(() => of({ id: 1, status: 'PENDING', total: 100, createdAt: '', customer: { id: 1, name: 'Test' } })),
    update: jest.fn(() => of({ id: 1, status: 'PROCESSING', total: 100, createdAt: '', customer: { id: 1, name: 'Test' } })),
  };
}

function makeCustomerServiceMock() {
  return {
    list: jest.fn(() => of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, first: true, last: true })),
  };
}

describe('OrderFormComponent (smoke)', () => {
  let fixture: ComponentFixture<OrderFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderFormComponent, RouterTestingModule],
      providers: [
        { provide: OrderStore, useValue: makeOrderStoreMock() },
        { provide: CustomerService, useValue: makeCustomerServiceMock() },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderFormComponent);
    fixture.detectChanges();
  });

  it('should render without errors', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should display the New Order heading', () => {
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe('New Order');
  });

  it('should render a form with submit button', () => {
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button[type="submit"]')).not.toBeNull();
  });
});
