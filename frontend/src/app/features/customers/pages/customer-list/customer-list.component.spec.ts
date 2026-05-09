import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { CustomerListComponent } from './customer-list.component';
import { CustomerStore } from '../../customer.store';

function makeCustomerStoreMock() {
  return {
    customers: signal([]).asReadonly(),
    loading: signal(false).asReadonly(),
    error: signal<string | null>(null).asReadonly(),
    params: signal({ page: 0, size: 20, sort: 'name,asc' }).asReadonly(),
    totalElements: signal(0).asReadonly(),
    totalPages: signal(0).asReadonly(),
    selected: signal(null).asReadonly(),
    currentPage: computed(() => 0),
    hasNext: computed(() => false),
    isEmpty: computed(() => true),
    load: jest.fn(() => of(void 0)),
    selectById: jest.fn(() => of(void 0)),
    create: jest.fn(),
    update: jest.fn(),
  };
}

describe('CustomerListComponent (smoke)', () => {
  let fixture: ComponentFixture<CustomerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerListComponent, RouterTestingModule],
      providers: [
        { provide: CustomerStore, useValue: makeCustomerStoreMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerListComponent);
    fixture.detectChanges();
  });

  it('should render without errors', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should display the Customers heading', () => {
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe('Customers');
  });

  it('should show the New Customer link', () => {
    const link = fixture.nativeElement.querySelector('a[routerlink="/customers/new"], a[href="/customers/new"]');
    expect(link).not.toBeNull();
  });
});
