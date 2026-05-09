import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  it('should render when open', () => {
    const { container } = createComponent(ModalTestHost);
    const dialog = container.querySelector('dialog');
    expect(dialog).toBeTruthy();
  });

  it('should display title', () => {
    const { container } = createComponent(ModalTestHost);
    expect(container.textContent).toContain('Test Modal');
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
  imports: [ModalComponent],
  template: `<app-modal [open]="true" title="Test Modal"><p>Content</p></app-modal>`,
})
class ModalTestHost {}
