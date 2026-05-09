import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-order-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<p>Order list — coming in PR D</p>`,
})
export class OrderListComponent {}
