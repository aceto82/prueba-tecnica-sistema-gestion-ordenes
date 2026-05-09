import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerStore } from '../../customer.store';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
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
      <h2>{{ isEditMode() ? 'Edit Customer' : 'New Customer' }}</h2>

      @if (store.error(); as err) {
        <p class="form-error">{{ err }}</p>
      }

      <form [formGroup]="customerForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="name">Name</label>
          <input
            id="name"
            type="text"
            class="form-control"
            formControlName="name"
          />
          @if (customerForm.get('name')?.invalid && customerForm.get('name')?.touched) {
            <p class="field-error">Name is required</p>
          }
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            class="form-control"
            formControlName="email"
          />
          @if (customerForm.get('email')?.invalid && customerForm.get('email')?.touched) {
            <p class="field-error">A valid email is required</p>
          }
        </div>

        <div class="actions">
          <button type="submit" class="btn btn-primary" [disabled]="customerForm.invalid || saving()">
            {{ saving() ? 'Saving...' : 'Save' }}
          </button>
          <button type="button" class="btn btn-cancel" (click)="goBack()">Cancel</button>
        </div>
      </form>
    </div>
  `,
})
export class CustomerFormComponent implements OnInit {
  private readonly store = inject(CustomerStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  private editId: number | null = null;

  readonly isEditMode = signal(false);

  readonly customerForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(180)]],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editId = Number(idParam);
      this.isEditMode.set(true);
      this.store.selectById(this.editId).subscribe({
        next: () => {
          const customer = this.store.selected();
          if (customer) {
            this.customerForm.patchValue({ name: customer.name, email: customer.email });
          }
        },
      });
    }
  }

  onSubmit(): void {
    if (this.customerForm.invalid) return;

    this.saving.set(true);
    const { name, email } = this.customerForm.value as { name: string; email: string };

    if (this.isEditMode() && this.editId !== null) {
      this.store.update(this.editId, { name, email }).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/customers']);
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.store.create({ name, email }).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/customers']);
        },
        error: () => this.saving.set(false),
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/customers']);
  }
}
