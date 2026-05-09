import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  it('should render with default variant', () => {
    const { container } = createComponent(BadgeDefaultTestHost);
    const badge = container.querySelector('.badge');
    expect(badge?.classList.contains('badge--default')).toBe(true);
    expect(badge?.textContent).toContain('Active');
  });

  it('should apply variant class', () => {
    const { container } = createComponent(BadgeVariantTestHost);
    const badge = container.querySelector('.badge');
    expect(badge?.classList.contains('badge--success')).toBe(true);
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
  imports: [BadgeComponent],
  template: `<app-badge>Active</app-badge>`,
})
class BadgeDefaultTestHost {}

@Component({
  standalone: true,
  imports: [BadgeComponent],
  template: `<app-badge variant="success">Completed</app-badge>`,
})
class BadgeVariantTestHost {}
