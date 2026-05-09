import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { Component } from '@angular/core';

describe('ButtonComponent', () => {
  it('should render with default variant', () => {
    const { container } = createComponent(ButtonTestHost);
    const btn = container.querySelector('button')!;
    expect(btn.classList.contains('btn--primary')).toBe(true);
  });

  it('should apply variant class', () => {
    const { container } = createComponent(ButtonVariantTestHost);
    const btn = container.querySelector('button')!;
    expect(btn.classList.contains('btn--danger')).toBe(true);
  });

  it('should emit clicked on click', () => {
    const { fixture, container } = createComponent(ButtonTestHost);
    const btn = container.querySelector('button')!;
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.clicked).toBe(1);
  });

  it('should not emit when disabled', () => {
    const { fixture, container } = createComponent(ButtonDisabledTestHost);
    const btn = container.querySelector('button')!;
    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.clicked).toBe(0);
  });

  it('should show loading spinner', () => {
    const { container } = createComponent(ButtonLoadingTestHost);
    const spinner = container.querySelector('.btn__spinner');
    expect(spinner).toBeTruthy();
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
  imports: [ButtonComponent],
  template: `<app-button (clicked)="clicked = clicked + 1">Click me</app-button>`,
})
class ButtonTestHost {
  clicked = 0;
}

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `<app-button variant="danger" (clicked)="clicked = clicked + 1">Delete</app-button>`,
})
class ButtonVariantTestHost {
  clicked = 0;
}

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `<app-button [disabled]="true" (clicked)="clicked = clicked + 1">Disabled</app-button>`,
})
class ButtonDisabledTestHost {
  clicked = 0;
}

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `<app-button [loading]="true">Loading</app-button>`,
})
class ButtonLoadingTestHost {}
