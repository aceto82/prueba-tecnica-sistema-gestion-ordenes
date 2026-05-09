import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../../../features/auth/auth.store';
import { ThemeStore } from '../../../../core/theme.store';
import { ButtonComponent } from '../../../../shared/components';

@Component({
  selector: 'app-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <header class="header">
      <div class="user-info">
        <span class="username">{{ authStore.currentUser()?.username }}</span>
      </div>
      <div class="actions">
        <app-button variant="ghost" size="sm" (clicked)="themeStore.toggle()">
          {{ themeStore.isDark() ? '☀️' : '🌙' }}
        </app-button>
        <app-button variant="danger" size="sm" (clicked)="onLogout()">Logout</app-button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 var(--space-lg);
      height: 56px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border-light);
      gap: var(--space-md);

      .user-info {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      .username {
        font-weight: 500;
        color: var(--color-text-secondary);
      }

      .actions {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }
    }
  `],
})
export class HeaderComponent {
  readonly authStore = inject(AuthStore);
  readonly themeStore = inject(ThemeStore);
  private readonly router = inject(Router);

  onLogout(): void {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}
