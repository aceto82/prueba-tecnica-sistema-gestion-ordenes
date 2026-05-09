import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

const AUTH_TOKEN_KEY = 'auth_token';

function decodeJwtPayload(token: string): { sub?: string; role?: string } {
  try {
    const base64Payload = token.split('.')[1];
    return JSON.parse(atob(base64Payload));
  } catch {
    return {};
  }
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);

  private readonly _token = signal<string | null>(null);
  private readonly _currentUser = signal<User | null>(null);

  readonly token = this._token.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null && this._currentUser() !== null);

  login(credentials: { username: string; password: string }): Observable<void> {
    return this.authService
      .login(credentials.username, credentials.password)
      .pipe(
        tap(({ token }) => {
          const payload = decodeJwtPayload(token);
          this._token.set(token);
          this._currentUser.set({
            username: payload.sub ?? credentials.username,
            role: payload.role ?? '',
          });
          localStorage.setItem(AUTH_TOKEN_KEY, token);
        }),
        map(() => void 0)
      );
  }

  logout(): void {
    this._token.set(null);
    this._currentUser.set(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  rehydrate(): void {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      const payload = decodeJwtPayload(token);
      this._token.set(token);
      this._currentUser.set({
        username: payload.sub ?? '',
        role: payload.role ?? '',
      });
    }
  }
}
