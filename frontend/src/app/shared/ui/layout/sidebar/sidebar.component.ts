import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../../features/auth/auth.store';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar">
      <ul>
        <li>
          <a routerLink="/orders" routerLinkActive="active">Orders</a>
        </li>
        <li>
          <a routerLink="/customers" routerLinkActive="active">Customers</a>
        </li>
        <li>
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        </li>
      </ul>
      @if (authStore.isAdmin()) {
        <div class="admin-section">
          <h3>Admin</h3>
          <ul>
            <li>
              <a routerLink="/users" routerLinkActive="active">Users</a>
            </li>
          </ul>
        </div>
      }
    </nav>
  `,
  styles: [`
    .sidebar {
      width: 220px;
      background: var(--color-surface);
      height: 100%;
      padding: 1rem 0;
      border-right: 1px solid var(--color-border-light);

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      a {
        display: block;
        padding: 0.75rem 1.5rem;
        color: var(--color-text-secondary);
        text-decoration: none;
        transition: background 0.2s, color 0.2s;

        &:hover,
        &.active {
          background: var(--color-primary);
          color: #fff;
        }
      }

      .admin-section {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid var(--color-border-light);
      }

      .admin-section h3 {
        padding: 0.75rem 1.5rem;
        margin: 0;
        font-size: 12px;
        text-transform: uppercase;
        color: var(--color-text-muted);
      }
    }
  `],
})
export class SidebarComponent {
  readonly authStore = inject(AuthStore);
}