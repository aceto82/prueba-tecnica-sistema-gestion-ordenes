import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { CustomerFormComponent } from './customer-form.component';
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
    create: jest.fn(() => of({ id: 1, name: 'New', email: 'new@test.com' })),
    update: jest.fn(() => of({ id: 1, name: 'Updated', email: 'updated@test.com' })),
  };
}

describe('CustomerFormComponent (smoke)', () => {
  let fixture: ComponentFixture<CustomerFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerFormComponent, RouterTestingModule],
      providers: [
        { provide: CustomerStore, useValue: makeCustomerStoreMock() },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerFormComponent);
    fixture.detectChanges();
  });

  it('should render without errors', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should display the New Customer heading', () => {
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe('New Customer');
  });

  it('should render a form with submit button', () => {
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button[type="submit"]')).not.toBeNull();
  });
});
