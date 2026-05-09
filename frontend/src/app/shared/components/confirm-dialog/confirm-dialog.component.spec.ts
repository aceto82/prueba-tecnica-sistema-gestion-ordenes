import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  it('should render message', () => {
    const { container } = createComponent(ConfirmTestHost);
    expect(container.textContent).toContain('Are you sure?');
  });

  it('should emit confirmed on confirm click', () => {
    const { fixture, container } = createComponent(ConfirmTestHost);
    const buttons = container.querySelectorAll('button');
    const confirmBtn = buttons[buttons.length - 1];
    confirmBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.confirmed).toBe(1);
  });

  it('should emit cancelled on cancel click', () => {
    const { fixture, container } = createComponent(ConfirmTestHost);
    const buttons = container.querySelectorAll('button');
    const cancelBtn = buttons[0];
    cancelBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.cancelled).toBe(1);
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
  imports: [ConfirmDialogComponent],
  template: `
    <app-confirm-dialog
      [open]="true"
      title="Confirm"
      message="Are you sure?"
      (confirmed)="confirmed = confirmed + 1"
      (cancelled)="cancelled = cancelled + 1"
    ></app-confirm-dialog>
  `,
})
class ConfirmTestHost {
  confirmed = 0;
  cancelled = 0;
}
