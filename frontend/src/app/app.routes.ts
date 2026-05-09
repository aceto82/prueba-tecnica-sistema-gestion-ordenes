import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './shared/ui/layout/layout.component';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login-page/login-page.component').then(
        (m) => m.LoginPageComponent
      ),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/orders.component').then(
            (m) => m.OrdersComponent
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/customers.component').then(
            (m) => m.CustomersComponent
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      { path: '', redirectTo: 'orders', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
