import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerStore } from '../../customer.store';
import { CardComponent, InputComponent, ButtonComponent } from '../../../../shared/components';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CardComponent, InputComponent, ButtonComponent],
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
        <h2>{{ isEditMode() ? 'Edit Customer' : 'New Customer' }}</h2>

        @if (store.error(); as err) {
          <p class="form-error">{{ err }}</p>
        }

        <form [formGroup]="customerForm" (ngSubmit)="onSubmit()">
          <app-input
            formControlName="name"
            label="Name"
            type="text"
            id="name"
          />

          <app-input
            formControlName="email"
            label="Email"
            type="email"
            id="email"
          />

          <div class="actions">
            <app-button type="submit" variant="primary" [disabled]="customerForm.invalid || saving()" [loading]="saving()">
              {{ saving() ? 'Saving...' : 'Save' }}
            </app-button>
            <app-button type="button" variant="outline" (clicked)="goBack()">Cancel</app-button>
          </div>
        </form>
      </app-card>
    </div>
  `,
})
export class CustomerFormComponent implements OnInit {
  readonly store = inject(CustomerStore);
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
