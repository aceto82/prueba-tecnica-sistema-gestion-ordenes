import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  it('should render projected content', () => {
    const { container } = createComponent(CardTestHost);
    expect(container.textContent).toContain('Card content');
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
  imports: [CardComponent],
  template: `<app-card><p>Card content</p></app-card>`,
})
class CardTestHost {}
