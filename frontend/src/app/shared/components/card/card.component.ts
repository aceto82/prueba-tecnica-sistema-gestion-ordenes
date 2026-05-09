import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type CardPadding = 'sm' | 'md' | 'lg';
export type CardShadow = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card" [class]="'card--pad-' + padding + ' card--shadow-' + shadow">
      <ng-content />
    </div>
  `,
  styles: [`
    .card {
      background: var(--color-surface);
      border-radius: var(--radius-md);
    }
    .card--pad-sm { padding: var(--space-md); }
    .card--pad-md { padding: var(--space-lg); }
    .card--pad-lg { padding: var(--space-xl); }
    .card--shadow-sm { box-shadow: var(--shadow-sm); }
    .card--shadow-md { box-shadow: var(--shadow-md); }
    .card--shadow-lg { box-shadow: var(--shadow-lg); }
  `],
})
export class CardComponent {
  @Input() padding: CardPadding = 'md';
  @Input() shadow: CardShadow = 'sm';
}
