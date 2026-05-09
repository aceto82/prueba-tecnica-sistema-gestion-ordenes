import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthStore } from '../../features/auth/auth.store';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.token();

  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(cloned);
  }

  return next(req);
};
