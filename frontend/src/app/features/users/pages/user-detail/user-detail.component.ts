import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { UserStore } from '../../user.store';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  styles: [
    `
      .detail-card {
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
      .detail-row {
        display: flex;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f0f0f0;
        font-size: 0.875rem;
      }
      .detail-row:last-child {
        border-bottom: none;
      }
      .detail-label {
        width: 120px;
        color: #888;
        flex-shrink: 0;
      }
      .detail-value {
        color: #333;
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
      .actions {
        margin-top: 1.5rem;
        display: flex;
        gap: 0.5rem;
      }
      .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .btn-outline {
        background: transparent;
        border: 1px solid #ccc;
        color: #555;
      }
      .btn-outline:hover {
        background: #f5f5f5;
      }
      .btn-primary {
        background: #1976d2;
        color: #fff;
      }
      .btn-primary:hover {
        background: #1565c0;
      }
      .loading-overlay {
        text-align: center;
        padding: 2rem;
        color: #888;
      }
      .error-state {
        text-align: center;
        padding: 2rem;
        color: #d32f2f;
        font-size: 0.875rem;
      }
    `,
  ],
  template: `
    @if (store.loading()) {
      <div class="loading-overlay">Loading user details...</div>
    } @else if (store.error(); as err) {
      <div class="error-state">{{ err }}</div>
    } @else if (store.selected(); as user) {
      <div class="detail-card">
        <h2>User #{{ user.id }}</h2>

        <div class="detail-row">
          <span class="detail-label">Username</span>
          <span class="detail-value">{{ user.username }}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Role</span>
          <span class="detail-value">
            <span class="role-badge" [class.admin]="user.role === 'ADMIN'" [class.user]="user.role === 'USER'">
              {{ user.role }}
            </span>
          </span>
        </div>

        <div class="detail-row">
          <span class="detail-label">Created</span>
          <span class="detail-value">{{ user.createdAt | date:'medium' }}</span>
        </div>

        <div class="actions">
          <a [routerLink]="['/users', user.id, 'edit']" class="btn btn-primary">Edit</a>
          <a routerLink="/users" class="btn btn-outline">Back to List</a>
        </div>
      </div>
    }
  `,
})
export class UserDetailComponent implements OnInit {
  readonly store = inject(UserStore);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.store.selectById(Number(idParam)).subscribe();
    }
  }
}
