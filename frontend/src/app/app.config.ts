import { APP_INITIALIZER, ApplicationConfig, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { AuthStore } from './features/auth/auth.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const authStore = inject(AuthStore);
        return () => authStore.rehydrate();
      },
      multi: true,
    },
  ],
};
