import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserStore } from '../../user.store';

@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .page-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #212121;
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
      .btn-primary:hover {
        background: #1565c0;
      }
      .btn-outline {
        background: transparent;
        border: 1px solid #ccc;
        color: #555;
      }
      .btn-outline:hover {
        background: #f5f5f5;
      }
      .btn-outline:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .btn-danger {
        background: transparent;
        border: 1px solid #d32f2f;
        color: #d32f2f;
      }
      .btn-danger:hover {
        background: #fff5f5;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      }
      th, td {
        text-align: left;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
      }
      th {
        background: #fafafa;
        font-weight: 600;
        color: #555;
        border-bottom: 1px solid #e0e0e0;
      }
      td {
        border-bottom: 1px solid #f0f0f0;
      }
      .empty-state {
        text-align: center;
        padding: 2rem;
        color: #888;
        font-size: 0.875rem;
      }
      .error-state {
        text-align: center;
        padding: 2rem;
        color: #d32f2f;
        font-size: 0.875rem;
      }
      .pagination {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1rem;
        justify-content: center;
      }
      .pagination span {
        font-size: 0.8125rem;
        color: #666;
      }
      .loading-overlay {
        text-align: center;
        padding: 2rem;
        color: #888;
      }
      .role-badge {
        display: inline-block;
        padding: 0.125rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      .role-badge.admin {
        background: #e3f2fd;
        color: #1565c0;
      }
      .role-badge.user {
        background: #f3e5f5;
        color: #7b1fa2;
      }
    `,
  ],
  template: `
    <div class="page-header">
      <h2>Users</h2>
      <a routerLink="/users/new" class="btn btn-primary">New User</a>
    </div>

    @if (store.loading()) {
      <div class="loading-overlay">Loading users...</div>
    } @else {
      @if (store.error(); as err) {
        <div class="error-state">{{ err }}</div>
      }

      @if (!store.error()) {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (user of store.users(); track user.id) {
              <tr>
                <td>{{ user.id }}</td>
                <td>{{ user.username }}</td>
                <td>
                  <span class="role-badge" [class.admin]="user.role === 'ADMIN'" [class.user]="user.role === 'USER'">
                    {{ user.role }}
                  </span>
                </td>
                <td>
                  <a [routerLink]="['/users', user.id, 'edit']" class="btn btn-outline">Edit</a>
                  <button class="btn btn-danger" (click)="deleteUser(user.id)" style="margin-left: 0.5rem;">Delete</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty-state">No users found. Create your first user!</td>
              </tr>
            }
          </tbody>
        </table>
      }

      @if (store.totalPages() > 1) {
        <div class="pagination">
          <button class="btn btn-outline" (click)="prevPage()" [disabled]="store.currentPage() === 0">Previous</button>
          <span>Page {{ store.currentPage() + 1 }} of {{ store.totalPages() }}</span>
          <button class="btn btn-outline" (click)="nextPage()" [disabled]="!store.hasNext()">Next</button>
        </div>
      }
    }
  `,
})
export class UserListComponent implements OnInit {
  readonly store = inject(UserStore);

  ngOnInit(): void {
    this.store.load().subscribe();
  }

  prevPage(): void {
    this.store.load({ page: this.store.currentPage() - 1 }).subscribe();
  }

  nextPage(): void {
    this.store.load({ page: this.store.currentPage() + 1 }).subscribe();
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.store.delete(id).subscribe();
    }
  }
}
