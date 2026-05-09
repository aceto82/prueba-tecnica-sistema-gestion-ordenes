import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderStore } from '../../order.store';
import { ORDER_STATUS_LABELS } from '../../../../core/models/order.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, CurrencyPipe, DatePipe, RouterLink],
  styles: [
    `
      .detail-card {
        max-width: 600px;
        background: #fff;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.25rem;
      }
      .page-header h2 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #212121;
      }
      .field {
        margin-bottom: 1rem;
      }
      .field-label {
        font-size: 0.75rem;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
      }
      .field-value {
        font-size: 0.9375rem;
        color: #212121;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1.5rem;
      }
      .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.875rem;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        transition: opacity 0.15s;
      }
      .btn-outline {
        background: transparent;
        border: 1px solid #ccc;
        color: #555;
      }
      .btn-outline:hover {
        background: #f5f5f5;
      }
      .btn-primary {
        background: #1976d2;
        color: #fff;
      }
      .btn-primary:hover {
        background: #1565c0;
      }
      .loading-overlay {
        text-align: center;
        padding: 2rem;
        color: #888;
      }
      .error-state {
        text-align: center;
        padding: 2rem;
        color: #d32f2f;
        font-size: 0.875rem;
      }
      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.8125rem;
        font-weight: 600;
        text-transform: uppercase;
      }
    `,
  ],
  template: `
    <ng-container *ngIf="store.loading(); else loaded">
      <div class="loading-overlay">Loading order...</div>
    </ng-container>

    <ng-template #loaded>
      <div *ngIf="store.error()" class="error-state">{{ store.error() }}</div>

      <div class="detail-card" *ngIf="store.selected() as order">
        <div class="page-header">
          <h2>Order #{{ order.id }}</h2>
          <a [routerLink]="['/orders', order.id, 'edit']" class="btn btn-outline">Edit</a>
        </div>

        <div class="field">
          <div class="field-label">Customer</div>
          <div class="field-value">{{ order.customer.name }}</div>
        </div>

        <div class="field">
          <div class="field-label">Status</div>
          <div class="field-value">
            <span class="status-badge">{{ ORDER_STATUS_LABELS[order.status] }}</span>
          </div>
        </div>

        <div class="field">
          <div class="field-label">Total</div>
          <div class="field-value">{{ order.total | currency }}</div>
        </div>

        <div class="field">
          <div class="field-label">Created</div>
          <div class="field-value">{{ order.createdAt | date:'medium' }}</div>
        </div>

        <div class="actions">
          <a routerLink="/orders" class="btn btn-outline">Back to Orders</a>
        </div>
      </div>
    </ng-template>
  `,
})
export class OrderDetailComponent implements OnInit {
  readonly store = inject(OrderStore);
  readonly ORDER_STATUS_LABELS = ORDER_STATUS_LABELS;

  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.store.selectById(id).subscribe();
    }
  }
}
