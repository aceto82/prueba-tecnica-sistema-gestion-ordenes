import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgFor, NgIf, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { OrderStore } from '../../order.store';
import { OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../../core/models/order.model';
import { AuthStore } from '../../../auth/auth.store';

@Component({
  selector: 'app-order-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, NgIf, NgStyle, FormsModule, RouterLink, CurrencyPipe, DatePipe],
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .page-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #212121;
      }
      .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: opacity 0.15s;
        text-decoration: none;
        display: inline-block;
      }
      .btn-primary {
        background: #1976d2;
        color: #fff;
      }
      .btn-primary:hover {
        background: #1565c0;
      }
      .btn-outline {
        background: transparent;
        border: 1px solid #ccc;
        color: #555;
      }
      .btn-outline:hover {
        background: #f5f5f5;
      }
      .btn-outline:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .filters {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .search-input {
        padding: 0.5rem 0.75rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 0.875rem;
        flex: 1;
        min-width: 200px;
      }
      .search-input:focus {
        outline: none;
        border-color: #1976d2;
      }
      .status-select {
        padding: 0.5rem 0.75rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 0.875rem;
        min-width: 140px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      }
      th, td {
        text-align: left;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
      }
      th {
        background: #fafafa;
        font-weight: 600;
        color: #555;
        border-bottom: 1px solid #e0e0e0;
      }
      td {
        border-bottom: 1px solid #f0f0f0;
      }
      .status-badge {
        display: inline-block;
        padding: 0.1875rem 0.5rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      .empty-state {
        text-align: center;
        padding: 2rem;
        color: #888;
        font-size: 0.875rem;
      }
      .error-state {
        text-align: center;
        padding: 2rem;
        color: #d32f2f;
        font-size: 0.875rem;
      }
      .pagination {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1rem;
        justify-content: center;
      }
      .pagination span {
        font-size: 0.8125rem;
        color: #666;
      }
      .loading-overlay {
        text-align: center;
        padding: 2rem;
        color: #888;
      }
    `,
  ],
  template: `
    <div class="page-header">
      <h2>Orders</h2>
      <a routerLink="/orders/new" class="btn btn-primary">New Order</a>
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
        <option *ngFor="let s of statuses; trackBy: trackByStatus" [value]="s">{{ ORDER_STATUS_LABELS[s] }}</option>
      </select>
    </div>

    <ng-container *ngIf="store.loading(); else loaded">
      <div class="loading-overlay">Loading orders...</div>
    </ng-container>

    <ng-template #loaded>
      <div *ngIf="store.error() as err" class="error-state">{{ err }}</div>

      <table *ngIf="!store.error()">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Total</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let order of store.orders(); trackBy: trackById">
            <td>{{ order.id }}</td>
            <td>{{ order.customer.name }}</td>
            <td>
              <span class="status-badge" [ngStyle]="{'background': ORDER_STATUS_COLORS[order.status]}">
                {{ ORDER_STATUS_LABELS[order.status] }}
              </span>
            </td>
            <td>{{ order.total | currency }}</td>
            <td>{{ order.createdAt | date:'short' }}</td>
            <td>
              <a [routerLink]="['/orders', order.id]" class="btn btn-outline">View</a>
              @if (authStore.isAdmin()) {
                <button class="btn btn-outline" style="margin-left: 0.5rem; color: #d32f2f;" (click)="deleteOrder(order.id)">Delete</button>
              }
            </td>
          </tr>
          <tr *ngIf="store.isEmpty()">
            <td colspan="6" class="empty-state">No orders found.</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" *ngIf="store.totalPages() > 1">
        <button class="btn btn-outline" (click)="prevPage()" [disabled]="store.currentPage() === 0">Previous</button>
        <span>Page {{ store.currentPage() + 1 }} of {{ store.totalPages() }}</span>
        <button class="btn btn-outline" (click)="nextPage()" [disabled]="!store.hasNext()">Next</button>
      </div>
    </ng-template>
  `,
})
export class OrderListComponent implements OnInit {
  readonly store = inject(OrderStore);
  readonly authStore = inject(AuthStore);

  readonly statuses: OrderStatus[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
  readonly ORDER_STATUS_LABELS = ORDER_STATUS_LABELS;
  readonly ORDER_STATUS_COLORS = ORDER_STATUS_COLORS;

  readonly searchTerm = signal('');
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

  prevPage(): void {
    this.store.load({ page: this.store.currentPage() - 1 }).subscribe();
  }

  nextPage(): void {
    this.store.load({ page: this.store.currentPage() + 1 }).subscribe();
  }

  deleteOrder(_id: number): void {
    // TODO: implement delete via store.delete(id)
  }

  trackById(_index: number, item: { id: number }): number {
    return item.id;
  }

  trackByStatus(_index: number, status: string): string {
    return status;
  }
}
