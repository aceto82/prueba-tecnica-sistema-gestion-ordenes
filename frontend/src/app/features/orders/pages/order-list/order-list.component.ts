import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { OrderStore } from '../../order.store';
import { OrderStatus, ORDER_STATUS_LABELS } from '../../../../core/models/order.model';
import { AuthStore } from '../../../auth/auth.store';
import { TableComponent, type TableColumn, PaginationComponent, BadgeComponent, ButtonComponent } from '../../../../shared/components';

@Component({
  selector: 'app-order-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe, TableComponent, PaginationComponent, BadgeComponent, ButtonComponent],
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-lg);
    }
    .page-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text);
    }
    .filters {
      display: flex;
      gap: var(--space-sm);
      margin-bottom: var(--space-md);
      align-items: center;
      flex-wrap: wrap;
    }
    .search-input {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      flex: 1;
      min-width: 200px;
      background: var(--color-surface);
      color: var(--color-text);
    }
    .search-input:focus {
      outline: none;
      border-color: var(--color-primary);
    }
    .status-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      min-width: 140px;
      background: var(--color-surface);
      color: var(--color-text);
    }
  `],
  template: `
    <div class="page-header">
      <h2>Orders</h2>
      <a routerLink="/orders/new"><app-button variant="primary">New Order</app-button></a>
    </div>

    <div class="filters">
      <input
        type="text"
        class="search-input"
        placeholder="Search by customer name..."
        [ngModel]="searchTerm()"
        (ngModelChange)="onSearch($event)"
      />
      <select
        class="status-select"
        [ngModel]="selectedStatus()"
        (ngModelChange)="onStatusChange($event)"
      >
        <option value="">All statuses</option>
        @for (s of statuses; track s) {
          <option [value]="s">{{ ORDER_STATUS_LABELS[s] }}</option>
        }
      </select>
    </div>

    <app-table
      [columns]="columns"
      [data]="store.orders()"
      [loading]="store.loading()"
      [error]="store.error()"
      emptyMessage="No orders found."
    >
      <ng-template #cell let-row let-col="column">
        @if (col.key === 'customer') {
          {{ row.customer.name }}
        } @else if (col.key === 'status') {
          <app-badge>{{ getStatusLabel(row.status) }}</app-badge>
        } @else if (col.key === 'total') {
          {{ row.total | currency }}
        } @else if (col.key === 'createdAt') {
          {{ row.createdAt | date:'short' }}
        } @else if (col.key === 'actions') {
          <a [routerLink]="['/orders', row.id]">
            <app-button variant="outline" size="sm">View</app-button>
          </a>
          @if (authStore.isAdmin()) {
            <app-button variant="danger-outline" size="sm" (clicked)="deleteOrder(row.id)">Delete</app-button>
          }
        } @else {
          {{ row[col.key] }}
        }
      </ng-template>
    </app-table>

    @if (store.totalPages() > 1) {
      <app-pagination
        [currentPage]="store.currentPage()"
        [totalPages]="store.totalPages()"
        [totalElements]="store.totalElements()"
        (pageChange)="onPageChange($event)"
      />
    }
  `,
})
export class OrderListComponent implements OnInit {
  readonly store = inject(OrderStore);
  readonly authStore = inject(AuthStore);

  readonly statuses: OrderStatus[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
  readonly ORDER_STATUS_LABELS = ORDER_STATUS_LABELS;

  readonly columns: TableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status' },
    { key: 'total', label: 'Total' },
    { key: 'createdAt', label: 'Created' },
    { key: 'actions', label: 'Actions' },
  ];

  readonly searchTerm = signal('');

  getStatusLabel(status: string): string {
    return ORDER_STATUS_LABELS[status as OrderStatus];
  }
  readonly selectedStatus = signal('');

  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => this.store.load({ q: q || undefined, page: 0 }))
      )
      .subscribe();

    this.store.load().subscribe();
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.searchSubject.next(value);
  }

  onStatusChange(value: string): void {
    this.selectedStatus.set(value);
    this.store
      .load({
        status: value === '' ? undefined : (value as OrderStatus),
        page: 0,
      })
      .subscribe();
  }

  onPageChange(page: number): void {
    this.store.load({ page }).subscribe();
  }

  deleteOrder(id: number): void {
    if (!confirm('Are you sure you want to delete this order?')) return;
    this.store.delete(id).subscribe({
      error: () => {
        this.store.load().subscribe();
      },
    });
  }
}
