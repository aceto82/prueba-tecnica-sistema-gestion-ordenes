import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerStore } from '../../customer.store';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, NgIf, RouterLink],
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
    `,
  ],
  template: `
    <div class="page-header">
      <h2>Customers</h2>
      <a routerLink="/customers/new" class="btn btn-primary">New Customer</a>
    </div>

    <ng-container *ngIf="store.loading(); else loaded">
      <div class="loading-overlay">Loading customers...</div>
    </ng-container>

    <ng-template #loaded>
      <div *ngIf="store.error() as err" class="error-state">{{ err }}</div>

      <table *ngIf="!store.error()">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let customer of store.customers(); trackBy: trackById">
            <td>{{ customer.id }}</td>
            <td>{{ customer.name }}</td>
            <td>{{ customer.email }}</td>
            <td>
              <a [routerLink]="['/customers', customer.id, 'edit']" class="btn btn-outline">Edit</a>
            </td>
          </tr>
          <tr *ngIf="store.isEmpty()">
            <td colspan="4" class="empty-state">No customers found. Create your first customer!</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" *ngIf="store.totalPages() > 1">
        <button class="btn btn-outline" (click)="prevPage()" [disabled]="store.currentPage() === 0">Previous</button>
        <span>Page {{ store.currentPage() + 1 }} of {{ store.totalPages() }}</span>
        <button class="btn btn-outline" (click)="nextPage()" [disabled]="!store.hasNext()">Next</button>
      </div>
    </ng-template>
  `,
})
export class CustomerListComponent implements OnInit {
  readonly store = inject(CustomerStore);

  ngOnInit(): void {
    this.store.load().subscribe();
  }

  prevPage(): void {
    this.store.load({ page: this.store.currentPage() - 1 }).subscribe();
  }

  nextPage(): void {
    this.store.load({ page: this.store.currentPage() + 1 }).subscribe();
  }

  trackById(_index: number, item: { id: number }): number {
    return item.id;
  }
}
