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
import { AuthStore } from '../auth.store';
import { CardComponent, InputComponent, ButtonComponent } from '../../../shared/components';

@Component({
  selector: 'app-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CardComponent, InputComponent, ButtonComponent],
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--color-bg);
    }

    .login-card {
      max-width: 400px;
      width: 100%;
    }

    .login-title {
      text-align: center;
      margin-bottom: var(--space-lg);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .login-error {
      color: var(--color-danger);
      font-size: 0.875rem;
      margin-top: var(--space-sm);
      text-align: center;
    }
  `],
  template: `
    <div class="login-container">
      <div class="login-card">
        <app-card padding="lg" shadow="md">
          <h1 class="login-title">Order Management System</h1>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
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

            <app-button
              type="submit"
              variant="primary"
              style="width: 100%; margin-top: var(--space-lg);"
              [disabled]="loginForm.invalid || loading()"
              [loading]="loading()"
            >
              {{ loading() ? 'Logging in...' : 'Log in' }}
            </app-button>

            @if (error()) {
              <p class="login-error">{{ error() }}</p>
            }
          </form>
        </app-card>
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
