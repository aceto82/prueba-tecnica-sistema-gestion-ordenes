import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../../core/models/customer.model';
import { CustomerService } from '../../core/services/customer.service';

export interface CustomerListParams {
  page: number;
  size: number;
  sort: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerStore {
  private readonly customerService = inject(CustomerService);

  private readonly _customers = signal<Customer[]>([]);
  private readonly _params = signal<CustomerListParams>({ page: 0, size: 20, sort: 'name,asc' });
  private readonly _totalElements = signal(0);
  private readonly _totalPages = signal(0);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selected = signal<Customer | null>(null);

  readonly customers = this._customers.asReadonly();
  readonly params = this._params.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selected = this._selected.asReadonly();

  readonly currentPage = computed(() => this._params().page);
  readonly hasNext = computed(() => this._params().page < this._totalPages() - 1);
  readonly isEmpty = computed(() => !this._loading() && this._customers().length === 0);

  load(patch: Partial<CustomerListParams> = {}): Observable<void> {
    const params = { ...this._params(), ...patch };
    this._params.set(params);
    this._loading.set(true);
    this._error.set(null);

    return new Observable<void>((observer) => {
      this.customerService.list(params.page, params.size, params.sort).subscribe({
        next: (page) => {
          this._customers.set(page.content);
          this._totalElements.set(page.totalElements);
          this._totalPages.set(page.totalPages);
          this._loading.set(false);
          observer.next();
          observer.complete();
        },
        error: (err) => {
          this._error.set(err?.message ?? 'Failed to load customers');
          this._loading.set(false);
          observer.error(err);
        },
      });
    });
  }

  selectById(id: number): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return new Observable<void>((observer) => {
      this.customerService.getById(id).subscribe({
        next: (customer) => {
          this._selected.set(customer);
          this._loading.set(false);
          observer.next();
          observer.complete();
        },
        error: (err) => {
          this._error.set(err?.message ?? 'Failed to load customer');
          this._loading.set(false);
          observer.error(err);
        },
      });
    });
  }

  create(req: CreateCustomerRequest): Observable<Customer> {
    this._error.set(null);
    return this.customerService.create(req).pipe(
      tap({
        next: (customer) => {
          this._customers.update((list) => [customer, ...list]);
          this._totalElements.update((n) => n + 1);
        },
        error: (err) => {
          this._error.set(err?.message ?? 'Failed to create customer');
        },
      })
    );
  }

  update(id: number, req: UpdateCustomerRequest): Observable<Customer> {
    this._error.set(null);
    return this.customerService.update(id, req).pipe(
      tap({
        next: (customer) => {
          this._customers.update((list) => list.map((c) => (c.id === id ? customer : c)));
          if (this._selected()?.id === id) this._selected.set(customer);
        },
        error: (err) => {
          this._error.set(err?.message ?? 'Failed to update customer');
        },
      })
    );
  }
}
