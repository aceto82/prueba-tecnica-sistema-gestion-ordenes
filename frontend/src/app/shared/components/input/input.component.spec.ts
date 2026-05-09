import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  it('should render with label', () => {
    const { container } = createComponent(InputLabelTestHost);
    const label = container.querySelector('label');
    expect(label?.textContent).toContain('Username');
  });

  it('should display error message', () => {
    const { container } = createComponent(InputErrorTestHost);
    const error = container.querySelector('.field-error');
    expect(error?.textContent).toContain('Required');
  });

  it('should update value on input', () => {
    const { fixture, container } = createComponent(InputModelTestHost);
    const input = container.querySelector('input')!;
    input.value = 'test';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toBe('test');
  });
});

function createComponent(component: any): { fixture: ComponentFixture<any>; container: HTMLElement } {
  TestBed.configureTestingModule({ imports: [component, FormsModule] });
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  return { fixture, container: fixture.nativeElement };
}

@Component({
  standalone: true,
  imports: [InputComponent],
  template: `<app-input label="Username"></app-input>`,
})
class InputLabelTestHost {}

@Component({
  standalone: true,
  imports: [InputComponent],
  template: `<app-input label="Email" error="Required"></app-input>`,
})
class InputErrorTestHost {}

@Component({
  standalone: true,
  imports: [InputComponent, FormsModule],
  template: `<app-input [(ngModel)]="value"></app-input>`,
})
class InputModelTestHost {
  value = '';
}
