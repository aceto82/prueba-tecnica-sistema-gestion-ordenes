import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderStore } from '../../order.store';
import { CustomerService } from '../../../../core/services/customer.service';
import { Customer } from '../../../../core/models/customer.model';
import { CardComponent, InputComponent, SelectComponent, ButtonComponent } from '../../../../shared/components';
import type { SelectOption } from '../../../../shared/components';

@Component({
  selector: 'app-order-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CardComponent, InputComponent, SelectComponent, ButtonComponent],
  styles: [`
    .form-card {
      max-width: 480px;
    }
    h2 {
      margin: 0 0 var(--space-lg);
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text);
    }
    .form-error {
      color: var(--color-danger);
      font-size: 0.8125rem;
      margin-bottom: var(--space-md);
    }
    .actions {
      display: flex;
      gap: var(--space-sm);
      margin-top: var(--space-lg);
    }
  `],
  template: `
    <div class="form-card">
      <app-card padding="lg">
        <h2>{{ isEditMode() ? 'Edit Order' : 'New Order' }}</h2>

        @if (store.error(); as err) {
          <p class="form-error">{{ err }}</p>
        }

        <form [formGroup]="orderForm" (ngSubmit)="onSubmit()">
          <app-select
            formControlName="customerId"
            label="Customer"
            [options]="customerOptions"
            placeholder="Select a customer..."
            id="customerId"
          />

          <app-input
            formControlName="total"
            label="Total"
            type="number"
            id="total"
          />

          <div class="actions">
            <app-button type="submit" variant="primary" [disabled]="orderForm.invalid || saving()" [loading]="saving()">
              {{ saving() ? 'Saving...' : 'Save' }}
            </app-button>
            <app-button type="button" variant="outline" (clicked)="goBack()">Cancel</app-button>
          </div>
        </form>
      </app-card>
    </div>
  `,
})
export class OrderFormComponent implements OnInit {
  readonly store = inject(OrderStore);
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly isEditMode = signal(false);
  readonly customers = signal<Customer[]>([]);

  get customerOptions(): SelectOption[] {
    return this.customers().map(c => ({ value: c.id, label: c.name }));
  }

  private editId: number | null = null;

  readonly orderForm = this.fb.group({
    customerId: [0, [Validators.required, Validators.min(1)]],
    total: [0, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    this.customerService.list(0, 200).subscribe({
      next: (page) => this.customers.set(page.content),
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editId = Number(idParam);
      this.isEditMode.set(true);

      this.store.selectById(this.editId).subscribe({
        next: () => {
          const order = this.store.selected();
          if (order) {
            this.orderForm.patchValue({
              customerId: order.customer.id,
              total: order.total,
            });
            this.orderForm.get('customerId')?.disable();
          }
        },
      });
    }
  }

  onSubmit(): void {
    if (this.orderForm.invalid) return;

    this.saving.set(true);
    const { customerId, total } = this.orderForm.value as {
      customerId: number;
      total: number;
    };

    if (this.isEditMode() && this.editId !== null) {
      this.store.update(this.editId, { total }).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/orders', this.editId]);
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.store.create({ customerId, total }).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/orders']);
        },
        error: () => this.saving.set(false),
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }
}
