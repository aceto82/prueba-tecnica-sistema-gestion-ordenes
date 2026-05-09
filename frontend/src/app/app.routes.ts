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
        loadChildren: () =>
          import('./features/orders/orders.routes').then(
            (m) => m.ORDER_ROUTES
          ),
      },
      {
        path: 'customers',
        loadChildren: () =>
          import('./features/customers/customers.routes').then(
            (m) => m.CUSTOMER_ROUTES
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
