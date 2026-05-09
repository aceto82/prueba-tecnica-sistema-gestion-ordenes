import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderStore } from '../../order.store';
import { ORDER_STATUS_LABELS } from '../../../../core/models/order.model';
import { CardComponent, BadgeComponent, ButtonComponent } from '../../../../shared/components';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, RouterLink, CardComponent, BadgeComponent, ButtonComponent],
  styles: [`
    .detail-card {
      max-width: 600px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-lg);
    }
    .page-header h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text);
    }
    .field {
      margin-bottom: var(--space-md);
    }
    .field-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }
    .field-value {
      font-size: 0.9375rem;
      color: var(--color-text);
    }
    .actions {
      display: flex;
      gap: var(--space-sm);
      margin-top: var(--space-lg);
    }
    .loading-overlay {
      text-align: center;
      padding: 2rem;
      color: var(--color-text-muted);
    }
    .error-state {
      text-align: center;
      padding: 2rem;
      color: var(--color-danger);
    }
  `],
  template: `
    @if (store.loading()) {
      <div class="loading-overlay">Loading order...</div>
    } @else {
      @if (store.error()) {
        <div class="error-state">{{ store.error() }}</div>
      }

      @if (store.selected(); as order) {
        <app-card class="detail-card" padding="lg">
          <div class="page-header">
            <h2>Order #{{ order.id }}</h2>
            <a [routerLink]="['/orders', order.id, 'edit']"><app-button variant="outline" size="sm">Edit</app-button></a>
          </div>

          <div class="field">
            <div class="field-label">Customer</div>
            <div class="field-value">{{ order.customer.name }}</div>
          </div>

          <div class="field">
            <div class="field-label">Status</div>
            <div class="field-value">
              <app-badge>{{ ORDER_STATUS_LABELS[order.status] }}</app-badge>
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
            <a routerLink="/orders"><app-button variant="outline">Back to Orders</app-button></a>
          </div>
        </app-card>
      }
    }
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
