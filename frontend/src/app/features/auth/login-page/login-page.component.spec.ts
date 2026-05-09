import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Signal, signal, computed } from '@angular/core';
import { of, throwError } from 'rxjs';
import { LoginPageComponent } from './login-page.component';
import { AuthStore } from '../auth.store';

// Typed mock for AuthStore — only the methods LoginPageComponent calls
interface AuthStoreMock {
  isAuthenticated: Signal<boolean>;
  currentUser: Signal<null>;
  token: Signal<string | null>;
  login: jest.Mock;
  logout: jest.Mock;
  rehydrate: jest.Mock;
}

function makeAuthStoreMock(loginResult: 'success' | 'error'): AuthStoreMock {
  return {
    isAuthenticated: computed(() => false),
    currentUser: signal(null).asReadonly(),
    token: signal<string | null>(null).asReadonly(),
    login: jest.fn(() =>
      loginResult === 'success' ? of(void 0) : throwError(() => new Error('401'))
    ),
    logout: jest.fn(),
    rehydrate: jest.fn(),
  };
}

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;
  let mockRouter: { navigate: jest.Mock };
  let mockStore: AuthStoreMock;

  function setup(loginResult: 'success' | 'error' = 'success'): void {
    mockStore = makeAuthStoreMock(loginResult);
    mockRouter = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      imports: [LoginPageComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthStore, useValue: mockStore },
        { provide: Router, useValue: mockRouter },
      ],
    });

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should render the login form', () => {
    setup();
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input[type="text"], input:not([type])')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input[type="password"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button[type="submit"]')).not.toBeNull();
  });

  it('should disable submit button when form is invalid', () => {
    setup();
    // Form is empty — both fields are required so form is invalid
    const btn = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('should call authStore.login with form values on submit', () => {
    setup('success');

    component.loginForm.setValue({ username: 'admin', password: 'admin123' });
    fixture.detectChanges();

    component.onSubmit();

    expect(mockStore.login).toHaveBeenCalledWith({
      username: 'admin',
      password: 'admin123',
    });
  });

  it('should navigate to / on successful login', () => {
    setup('success');

    component.loginForm.setValue({ username: 'admin', password: 'admin123' });
    fixture.detectChanges();

    component.onSubmit();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should display error message on login failure', () => {
    setup('error');

    component.loginForm.setValue({ username: 'wrong', password: 'wrongpass' });
    fixture.detectChanges();

    component.onSubmit();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.login-error') as HTMLElement;
    expect(errorEl).not.toBeNull();
    expect(errorEl.textContent?.trim()).toBe('Invalid username or password');
  });
});
