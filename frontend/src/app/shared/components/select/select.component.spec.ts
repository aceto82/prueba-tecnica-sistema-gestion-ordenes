import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectComponent } from './select.component';

describe('SelectComponent', () => {
  it('should render options', () => {
    const { container } = createComponent(SelectTestHost);
    const options = container.querySelectorAll('option');
    expect(options.length).toBe(3); // placeholder + 2 options
  });

  it('should display error', () => {
    const { container } = createComponent(SelectErrorTestHost);
    const error = container.querySelector('.field-error');
    expect(error?.textContent).toContain('Required');
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
  imports: [SelectComponent],
  template: `
    <app-select
      label="Role"
      placeholder="Select..."
      [options]="[{ value: 'ADMIN', label: 'Admin' }, { value: 'USER', label: 'User' }]"
    ></app-select>
  `,
})
class SelectTestHost {}

@Component({
  standalone: true,
  imports: [SelectComponent],
  template: `<app-select label="Role" error="Required"></app-select>`,
})
class SelectErrorTestHost {}
