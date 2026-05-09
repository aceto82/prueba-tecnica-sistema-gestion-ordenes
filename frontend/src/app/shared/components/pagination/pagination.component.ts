import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages > 1) {
      <div class="pagination">
        <button
          class="btn btn--outline btn--sm"
          (click)="goToPage(currentPage - 1)"
          [disabled]="currentPage === 0"
        >
          Previous
        </button>
        <span>Page {{ currentPage + 1 }} of {{ totalPages }}</span>
        <button
          class="btn btn--outline btn--sm"
          (click)="goToPage(currentPage + 1)"
          [disabled]="currentPage >= totalPages - 1"
        >
          Next
        </button>
      </div>
    }
  `,
})
export class PaginationComponent {
  @Input() currentPage = 0;
  @Input() totalPages = 0;
  @Input() totalElements = 0;
  @Output() pageChange = new EventEmitter<number>();

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.pageChange.emit(page);
  }
}
