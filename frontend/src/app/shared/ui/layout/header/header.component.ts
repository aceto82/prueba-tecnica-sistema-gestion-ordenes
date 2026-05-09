import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../../features/auth/auth.store';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <header class="header">
      <div class="user-info">
        <span class="username">{{ authStore.currentUser()?.username }}</span>
      </div>
      <button class="logout-btn" (click)="onLogout()">Logout</button>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 1.5rem;
      height: 56px;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      gap: 1rem;

      .username {
        font-weight: 500;
        color: #475569;
      }

      .logout-btn {
        padding: 0.375rem 0.875rem;
        background: #ef4444;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: background 0.2s;

        &:hover {
          background: #dc2626;
        }
      }
    }
  `],
})
export class HeaderComponent {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  onLogout(): void {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}
