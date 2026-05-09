import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `<p>User detail — coming soon</p>`,
})
export class UserDetailComponent {}
