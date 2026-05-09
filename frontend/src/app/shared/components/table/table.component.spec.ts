import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TableComponent } from './table.component';

describe('TableComponent', () => {
  it('should render data rows', () => {
    const { container } = createComponent(TableTestHost);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should show empty message when no data', () => {
    const { container } = createComponent(TableEmptyTestHost);
    expect(container.textContent).toContain('No data');
  });

  it('should show loading state', () => {
    const { container } = createComponent(TableLoadingTestHost);
    expect(container.textContent).toContain('Loading');
  });
});

function createComponent(component: any): { fixture: ComponentFixture<any>; container: HTMLElement } {
  TestBed.configureTestingModule({ imports: [component] });
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  return { fixture, container: fixture.nativeElement };
}

@Component({
  standalone: true,
  imports: [TableComponent],
  template: `
    <app-table
      [columns]="[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }]"
      [data]="[{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]"
    ></app-table>
  `,
})
class TableTestHost {}

@Component({
  standalone: true,
  imports: [TableComponent],
  template: `
    <app-table
      [columns]="[{ key: 'id', label: 'ID' }]"
      [data]="[]"
    ></app-table>
  `,
})
class TableEmptyTestHost {}

@Component({
  standalone: true,
  imports: [TableComponent],
  template: `
    <app-table
      [columns]="[{ key: 'id', label: 'ID' }]"
      [data]="[]"
      [loading]="true"
    ></app-table>
  `,
})
class TableLoadingTestHost {}
