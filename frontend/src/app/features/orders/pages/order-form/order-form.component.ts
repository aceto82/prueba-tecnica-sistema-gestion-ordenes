import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderStore } from '../../order.store';
import { CustomerService } from '../../../../core/services/customer.service';
import { Customer } from '../../../../core/models/customer.model';

@Component({
  selector: 'app-order-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgIf, NgFor, CurrencyPipe],
  styles: [
    `
      .form-card {
        max-width: 480px;
        background: #fff;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      }
      h2 {
        margin: 0 0 1.25rem;
        font-size: 1.125rem;
        font-weight: 600;
        color: #212121;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      .form-group label {
        display: block;
        margin-bottom: 0.375rem;
        font-size: 0.875rem;
        color: #555;
      }
      .form-control {
        display: block;
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 0.875rem;
        box-sizing: border-box;
        transition: border-color 0.15s;
      }
      .form-control:focus {
        outline: none;
        border-color: #1976d2;
      }
      .field-error {
        color: #d32f2f;
        font-size: 0.75rem;
        margin-top: 0.25rem;
      }
      .form-error {
        color: #d32f2f;
        font-size: 0.8125rem;
        margin-bottom: 1rem;
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
        transition: opacity 0.15s;
      }
      .btn-primary {
        background: #1976d2;
        color: #fff;
      }
      .btn-primary:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .btn-primary:not(:disabled):hover {
        background: #1565c0;
      }
      .btn-cancel {
        background: transparent;
        border: 1px solid #ccc;
        color: #555;
      }
      .btn-cancel:hover {
        background: #f5f5f5;
      }
    `,
  ],
  template: `
    <div class="form-card">
      <h2>{{ isEditMode() ? 'Edit Order' : 'New Order' }}</h2>

      <p *ngIf="store.error() as err" class="form-error">{{ err }}</p>

      <form [formGroup]="orderForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="customerId">Customer</label>
          <select
            id="customerId"
            class="form-control"
            formControlName="customerId"
          >
            <option value="">Select a customer...</option>
            <option *ngFor="let c of customers()" [value]="c.id">{{ c.name }}</option>
          </select>
          <p *ngIf="orderForm.get('customerId')?.invalid && orderForm.get('customerId')?.touched" class="field-error">
            Customer is required
          </p>
        </div>

        <div class="form-group">
          <label for="total">Total</label>
          <input
            id="total"
            type="number"
            class="form-control"
            formControlName="total"
            step="0.01"
            min="0.01"
          />
          <p *ngIf="orderForm.get('total')?.invalid && orderForm.get('total')?.touched" class="field-error">
            Total must be greater than 0
          </p>
        </div>

        <div class="actions">
          <button type="submit" class="btn btn-primary" [disabled]="orderForm.invalid || saving()">
            {{ saving() ? 'Saving...' : 'Save' }}
          </button>
          <button type="button" class="btn btn-cancel" (click)="goBack()">Cancel</button>
        </div>
      </form>
    </div>
  `,
})
export class OrderFormComponent implements OnInit {
  private readonly store = inject(OrderStore);
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly isEditMode = signal(false);
  readonly customers = signal<Customer[]>([]);

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
