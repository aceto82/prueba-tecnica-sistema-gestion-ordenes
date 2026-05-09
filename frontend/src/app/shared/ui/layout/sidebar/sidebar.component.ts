import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../features/auth/auth.store';

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
      background: #1e293b;
      height: 100%;
      padding: 1rem 0;

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      a {
        display: block;
        padding: 0.75rem 1.5rem;
        color: #cbd5e1;
        text-decoration: none;
        transition: background 0.2s;

        &:hover,
        &.active {
          background: #334155;
          color: #fff;
        }
      }

      .admin-section {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #334155;
      }

      .admin-section h3 {
        padding: 0.75rem 1.5rem;
        margin: 0;
        font-size: 12px;
        text-transform: uppercase;
        color: #64748b;
      }
    }
  `],
})
export class SidebarComponent {
  readonly authStore = inject(AuthStore);
}