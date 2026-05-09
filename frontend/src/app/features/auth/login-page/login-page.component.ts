import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthStore } from '../auth.store';

@Component({
  selector: 'app-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgIf],
  styles: [
    `
      .login-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: #f5f5f5;
      }

      .login-card {
        background: #fff;
        max-width: 400px;
        width: 100%;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
      }

      .login-title {
        text-align: center;
        margin-bottom: 1.5rem;
        font-size: 1.25rem;
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
        font-size: 1rem;
        box-sizing: border-box;
        transition: border-color 0.15s;
      }

      .form-control:focus {
        outline: none;
        border-color: #1976d2;
      }

      .btn-submit {
        display: block;
        width: 100%;
        padding: 0.6rem;
        background: #1976d2;
        color: #fff;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        margin-top: 1.25rem;
        transition: opacity 0.15s;
      }

      .btn-submit:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .btn-submit:not(:disabled):hover {
        background: #1565c0;
      }

      .login-error {
        color: #d32f2f;
        font-size: 0.875rem;
        margin-top: 0.5rem;
        text-align: center;
      }
    `,
  ],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1 class="login-title">Order Management System</h1>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              type="text"
              class="form-control"
              formControlName="username"
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-control"
              formControlName="password"
              autocomplete="current-password"
            />
          </div>

          <button
            type="submit"
            class="btn-submit"
            [disabled]="loginForm.invalid || loading()"
          >
            {{ loading() ? 'Logging in...' : 'Log in' }}
          </button>

          <p *ngIf="error()" class="login-error">{{ error() }}</p>
        </form>
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { username, password } = this.loginForm.value as {
      username: string;
      password: string;
    };

    this.authStore.login({ username, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: () => {
        this.error.set('Invalid username or password');
        this.loading.set(false);
      },
    });
  }
}
