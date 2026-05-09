import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  it('should render page info', () => {
    const { container } = createComponent(PaginationTestHost);
    expect(container.textContent).toContain('Page 1 of 3');
  });

  it('should not render when single page', () => {
    const { container } = createComponent(PaginationSingleTestHost);
    expect(container.querySelector('.pagination')).toBeFalsy();
  });

  it('should emit page change on next click', () => {
    const { fixture, container } = createComponent(PaginationTestHost);
    const buttons = container.querySelectorAll('button');
    const nextBtn = buttons[buttons.length - 1]; // last button is Next
    nextBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.page).toBe(1);
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
  imports: [PaginationComponent],
  template: `<app-pagination [currentPage]="0" [totalPages]="3" (pageChange)="page = $event"></app-pagination>`,
})
class PaginationTestHost {
  page = 0;
}

@Component({
  standalone: true,
  imports: [PaginationComponent],
  template: `<app-pagination [currentPage]="0" [totalPages]="1"></app-pagination>`,
})
class PaginationSingleTestHost {}
