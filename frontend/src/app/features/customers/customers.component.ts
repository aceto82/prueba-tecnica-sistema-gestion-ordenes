import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-customers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<p>Customers — coming in Fase 2</p>`,
})
export class CustomersComponent {}
