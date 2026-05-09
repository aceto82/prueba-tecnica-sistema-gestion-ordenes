import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserStore } from '../../user.store';

@Component({
  selector: 'app-user-form',
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
      <h2>{{ isEditMode() ? 'Edit User' : 'New User' }}</h2>

      @if (store.error(); as err) {
        <p class="form-error">{{ err }}</p>
      }

      <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            class="form-control"
            formControlName="username"
          />
          @if (userForm.get('username')?.invalid && userForm.get('username')?.touched) {
            <p class="field-error">Username is required</p>
          }
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            class="form-control"
            formControlName="password"
          />
          @if (userForm.get('password')?.invalid && userForm.get('password')?.touched) {
            <p class="field-error">{{ isEditMode() ? 'Password must be at least 6 characters' : 'Password is required' }}</p>
          }
        </div>

        <div class="form-group">
          <label for="role">Role</label>
          <select id="role" class="form-control" formControlName="role">
            <option value="">Select a role</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </select>
          @if (userForm.get('role')?.invalid && userForm.get('role')?.touched) {
            <p class="field-error">Role is required</p>
          }
        </div>

        <div class="actions">
          <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid || saving()">
            {{ saving() ? 'Saving...' : 'Save' }}
          </button>
          <button type="button" class="btn btn-cancel" (click)="goBack()">Cancel</button>
        </div>
      </form>
    </div>
  `,
})
export class UserFormComponent implements OnInit {
  private readonly store = inject(UserStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  private editId: number | null = null;

  readonly isEditMode = signal(false);

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
