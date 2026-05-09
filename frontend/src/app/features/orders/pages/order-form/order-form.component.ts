import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-order-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<p>Order form — coming in PR D</p>`,
})
export class OrderFormComponent {}
