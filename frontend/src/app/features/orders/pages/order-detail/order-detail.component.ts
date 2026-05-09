import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<p>Order detail — coming in PR D</p>`,
})
export class OrderDetailComponent {}
