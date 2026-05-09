import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserStore } from '../../user.store';
import { TableComponent, type TableColumn, PaginationComponent, ButtonComponent, BadgeComponent } from '../../../../shared/components';

@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TableComponent, PaginationComponent, ButtonComponent, BadgeComponent],
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-lg);
    }
    .page-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text);
    }
  `],
  template: `
    <div class="page-header">
      <h2>Users</h2>
      <a routerLink="/users/new"><app-button variant="primary">New User</app-button></a>
    </div>

    <app-table
      [columns]="columns"
      [data]="store.users()"
      [loading]="store.loading()"
      [error]="store.error()"
      emptyMessage="No users found. Create your first user!"
    >
      <ng-template #cell let-row let-col="column">
        @if (col.key === 'role') {
          <app-badge [variant]="row.role === 'ADMIN' ? 'primary' : 'default'">{{ row.role }}</app-badge>
        } @else if (col.key === 'actions') {
          <a [routerLink]="['/users', row.id, 'edit']">
            <app-button variant="outline" size="sm">Edit</app-button>
          </a>
          <app-button variant="danger-outline" size="sm" (clicked)="deleteUser(row.id)">Delete</app-button>
        } @else {
          {{ row[col.key] }}
        }
      </ng-template>
    </app-table>

    @if (store.totalPages() > 1) {
      <app-pagination
        [currentPage]="store.currentPage()"
        [totalPages]="store.totalPages()"
        [totalElements]="store.totalElements()"
        (pageChange)="onPageChange($event)"
      />
    }
  `,
})
export class UserListComponent implements OnInit {
  readonly store = inject(UserStore);

  readonly columns: TableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'username', label: 'Username' },
    { key: 'role', label: 'Role' },
    { key: 'actions', label: 'Actions' },
  ];

  ngOnInit(): void {
    this.store.load().subscribe();
  }

  onPageChange(page: number): void {
    this.store.load({ page }).subscribe();
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.store.delete(id).subscribe();
    }
  }
}
