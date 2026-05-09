import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const USER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/user-list/user-list.component').then(
        (m) => m.UserListComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/user-form/user-form.component').then(
        (m) => m.UserFormComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/user-detail/user-detail.component').then(
        (m) => m.UserDetailComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/user-form/user-form.component').then(
        (m) => m.UserFormComponent
      ),
    canActivate: [authGuard],
  },
];
