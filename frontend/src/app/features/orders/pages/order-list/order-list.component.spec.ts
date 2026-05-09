import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { OrderListComponent } from './order-list.component';
import { OrderStore } from '../../order.store';
import { AuthStore } from '../../../auth/auth.store';

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
    load: jest.fn(() => of(void 0)),
  };
}

function makeAuthStoreMock() {
  return {
    isAdmin: computed(() => false),
    isAuthenticated: computed(() => true),
    token: signal<string | null>('tok').asReadonly(),
    currentUser: signal(null).asReadonly(),
    login: jest.fn(),
    logout: jest.fn(),
    rehydrate: jest.fn(),
  };
}

describe('OrderListComponent (smoke)', () => {
  let fixture: ComponentFixture<OrderListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderListComponent, RouterTestingModule],
      providers: [
        { provide: OrderStore, useValue: makeOrderStoreMock() },
        { provide: AuthStore, useValue: makeAuthStoreMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderListComponent);
    fixture.detectChanges();
  });

  it('should render without errors', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should display the Orders heading', () => {
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe('Orders');
  });

  it('should show the New Order link', () => {
    const link = fixture.nativeElement.querySelector('a[routerlink="/orders/new"], a[href="/orders/new"]');
    expect(link).not.toBeNull();
  });
});
