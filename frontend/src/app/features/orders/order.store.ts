import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Order, CreateOrderRequest, UpdateOrderRequest, OrderStatus } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';

export interface OrderListParams {
  page: number;
  size: number;
  sort: string;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderStore {
  private readonly orderService = inject(OrderService);

  private readonly _orders = signal<Order[]>([]);
  private readonly _params = signal<OrderListParams>({ page: 0, size: 20, sort: 'createdAt,desc' });
  private readonly _totalElements = signal(0);
  private readonly _totalPages = signal(0);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selected = signal<Order | null>(null);

  readonly orders = this._orders.asReadonly();
  readonly params = this._params.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selected = this._selected.asReadonly();

  readonly currentPage = computed(() => this._params().page);
  readonly hasNext = computed(() => this._params().page < this._totalPages() - 1);
  readonly isEmpty = computed(() => !this._loading() && this._orders().length === 0);

  load(patch: Partial<OrderListParams> = {}): Observable<void> {
    const params = { ...this._params(), ...patch };
    this._params.set(params);
    this._loading.set(true);
    this._error.set(null);

    return new Observable<void>((observer) => {
      this.orderService
        .list(params.page, params.size, params.sort, params.status, params.dateFrom, params.dateTo, params.q)
        .subscribe({
          next: (page) => {
            this._orders.set(page.content);
            this._totalElements.set(page.totalElements);
            this._totalPages.set(page.totalPages);
            this._loading.set(false);
            observer.next();
            observer.complete();
          },
          error: (err) => {
            this._error.set(err?.message ?? 'Failed to load orders');
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
      this.orderService.getById(id).subscribe({
        next: (order) => {
          this._selected.set(order);
          this._loading.set(false);
          observer.next();
          observer.complete();
        },
        error: (err) => {
          this._error.set(err?.message ?? 'Failed to load order');
          this._loading.set(false);
          observer.error(err);
        },
      });
    });
  }

  create(req: CreateOrderRequest): Observable<Order> {
    this._error.set(null);
    return this.orderService.create(req).pipe(
      tap({
        next: (order) => {
          this._orders.update((list) => [order, ...list]);
          this._totalElements.update((n) => n + 1);
        },
        error: (err) => {
          this._error.set(err?.message ?? 'Failed to create order');
        },
      })
    );
  }

  update(id: number, req: UpdateOrderRequest): Observable<Order> {
    this._error.set(null);
    return this.orderService.update(id, req).pipe(
      tap({
        next: (order) => {
          this._orders.update((list) => list.map((o) => (o.id === id ? order : o)));
          if (this._selected()?.id === id) this._selected.set(order);
        },
        error: (err) => {
          this._error.set(err?.message ?? 'Failed to update order');
        },
      })
    );
  }

  delete(id: number): Observable<void> {
    this._error.set(null);
    return this.orderService.delete(id).pipe(
      tap({
        next: () => {
          this._orders.update((list) => list.filter((o) => o.id !== id));
          this._totalElements.update((n) => n - 1);
          if (this._selected()?.id === id) this._selected.set(null);
        },
        error: (err) => {
          this._error.set(err?.message ?? 'Failed to delete order');
        },
      })
    );
  }
}
