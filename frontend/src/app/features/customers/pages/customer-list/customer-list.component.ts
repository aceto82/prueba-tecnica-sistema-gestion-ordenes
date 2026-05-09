import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CustomerStore } from '../../customer.store';
import { TableComponent, type TableColumn } from '../../../../shared/components';
import { PaginationComponent } from '../../../../shared/components';
import { ButtonComponent } from '../../../../shared/components';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TableComponent, PaginationComponent, ButtonComponent],
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
      <h2>Customers</h2>
      <a routerLink="/customers/new"><app-button variant="primary">New Customer</app-button></a>
    </div>

    <app-table
      [columns]="columns"
      [data]="store.customers()"
      [loading]="store.loading()"
      [error]="store.error()"
      emptyMessage="No customers found. Create your first customer!"
    >
      <ng-template #cell let-row let-col="column">
        @if (col.key === 'actions') {
          <a [routerLink]="['/customers', row.id, 'edit']">
            <app-button variant="outline" size="sm">Edit</app-button>
          </a>
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
export class CustomerListComponent implements OnInit {
  readonly store = inject(CustomerStore);

  readonly columns: TableColumn[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'actions', label: 'Actions' },
  ];

  ngOnInit(): void {
    this.store.load().subscribe();
  }

  onPageChange(page: number): void {
    this.store.load({ page }).subscribe();
  }
}
