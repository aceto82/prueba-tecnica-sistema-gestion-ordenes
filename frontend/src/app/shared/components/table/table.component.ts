import { ChangeDetectionStrategy, Component, ContentChild, Input, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `
    @if (loading) {
      <div class="loading-overlay">Loading...</div>
    } @else {
      @if (error) {
        <div class="error-state">{{ error }}</div>
      }

      @if (!error) {
        <table class="table">
          <thead>
            <tr>
              @for (col of columns; track col.key) {
                <th>{{ col.label }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of data; track trackBy ? trackBy(row) : row) {
              <tr>
                @for (col of columns; track col.key) {
                  <td>
                    @if (cellTemplate) {
                      <ng-container
                        [ngTemplateOutlet]="cellTemplate"
                        [ngTemplateOutletContext]="{ $implicit: row, column: col }"
                      />
                    } @else {
                      {{ row[col.key] }}
                    }
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="columns.length" class="empty-state">{{ emptyMessage }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    }
  `,
})
export class TableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() emptyMessage = 'No data found.';
  @Input() trackBy: ((item: any) => any) | null = null;

  @ContentChild('cell', { static: false }) cellTemplate?: TemplateRef<any>;
}
