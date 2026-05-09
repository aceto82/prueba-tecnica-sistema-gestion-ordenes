import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserStore } from '../../user.store';
import { CardComponent, InputComponent, SelectComponent, ButtonComponent } from '../../../../shared/components';
import type { SelectOption } from '../../../../shared/components';

@Component({
  selector: 'app-user-form',
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
        <h2>{{ isEditMode() ? 'Edit User' : 'New User' }}</h2>

        @if (store.error(); as err) {
          <p class="form-error">{{ err }}</p>
        }

        <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
          <app-input
            formControlName="username"
            label="Username"
            type="text"
            id="username"
          />

          <app-input
            formControlName="password"
            label="Password"
            type="password"
            id="password"
          />

          <app-select
            formControlName="role"
            label="Role"
            [options]="roleOptions"
            placeholder="Select a role"
            id="role"
          />

          <div class="actions">
            <app-button type="submit" variant="primary" [disabled]="userForm.invalid || saving()" [loading]="saving()">
              {{ saving() ? 'Saving...' : 'Save' }}
            </app-button>
            <app-button type="button" variant="outline" (clicked)="goBack()">Cancel</app-button>
          </div>
        </form>
      </app-card>
    </div>
  `,
})
export class UserFormComponent implements OnInit {
  readonly store = inject(UserStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  private editId: number | null = null;

  readonly isEditMode = signal(false);

  readonly roleOptions: SelectOption[] = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'USER', label: 'User' },
  ];

  readonly userForm = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    password: ['', this.isEditMode() ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)]],
    role: ['', Validators.required],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editId = Number(idParam);
      this.isEditMode.set(true);

      // Update password validators: optional in edit mode
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.setValidators([Validators.minLength(6)]);
      this.userForm.get('password')?.updateValueAndValidity();

      this.store.selectById(this.editId).subscribe({
        next: () => {
          const user = this.store.selected();
          if (user) {
            this.userForm.patchValue({ username: user.username, role: user.role });
          }
        },
      });
    }
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;

    this.saving.set(true);
    const { username, password, role } = this.userForm.value as {
      username: string;
      password: string;
      role: string;
    };

    if (this.isEditMode() && this.editId !== null) {
      this.store.update(this.editId, { username, role }).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/users']);
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.store.create({ username, password, role }).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/users']);
        },
        error: () => this.saving.set(false),
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }
}
