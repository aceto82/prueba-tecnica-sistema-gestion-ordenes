import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<p>Customer detail — coming soon</p>`,
})
export class CustomerDetailComponent {}
