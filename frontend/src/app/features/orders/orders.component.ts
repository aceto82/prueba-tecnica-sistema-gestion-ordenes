import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<p>Orders — coming in Fase 2</p>`,
})
export class OrdersComponent {}
