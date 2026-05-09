import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SidebarComponent, HeaderComponent, RouterOutlet],
  template: `
    <div class="shell">
      <app-sidebar />
      <div class="main">
        <app-header />
        <div class="content">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .content {
      flex: 1;
      overflow: auto;
      padding: 1.5rem;
    }
  `],
})
export class LayoutComponent {}
