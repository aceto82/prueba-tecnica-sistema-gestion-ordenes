import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User, CreateUserRequest, UpdateUserRequest } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';

export interface UserListParams {
  page: number;
  size: number;
  sort: string;
}

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly userService = inject(UserService);

  private readonly _users = signal<User[]>([]);
  private readonly _params = signal<UserListParams>({ page: 0, size: 10, sort: 'id,asc' });
  private readonly _totalElements = signal(0);
  private readonly _totalPages = signal(0);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selected = signal<User | null>(null);

  readonly users = this._users.asReadonly();
  readonly params = this._params.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selected = this._selected.asReadonly();

  readonly currentPage = computed(() => this._params().page);
  readonly hasNext = computed(() => this._params().page < this._totalPages() - 1);
  readonly isEmpty = computed(() => !this._loading() && this._users().length === 0);

  load(patch: Partial<UserListParams> = {}): Observable<void> {
    const params = { ...this._params(), ...patch };
    this._params.set(params);
    this._loading.set(true);
    this._error.set(null);

    return new Observable<void>((observer) => {
      this.userService.list(params.page, params.size, params.sort).subscribe({
        next: (page) => {
          this._users.set(page.content);
          this._totalElements.set(page.totalElements);
          this._totalPages.set(page.totalPages);
          this._loading.set(false);
          observer.next();
          observer.complete();
        },
        error: (err) => {
          this._error.set(err?.message ?? 'Failed to load users');
          this._loading.set(false);
          observer.error(err);
        },
      });
    });
  }

  selectById(id: number): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return new Observable<void>((observer) => {
      this.userService.getById(id).subscribe({
        next: (user) => {
          this._selected.set(user);
          this._loading.set(false);
          observer.next();
          observer.complete();
        },
        error: (err) => {
          this._error.set(err?.message ?? 'Failed to load user');
          this._loading.set(false);
          observer.error(err);
        },
      });
    });
  }

  create(req: CreateUserRequest): Observable<User> {
    this._error.set(null);
    return this.userService.create(req).pipe(
      tap({
        next: (user) => {
          this._users.update((list) => [user, ...list]);
          this._totalElements.update((n) => n + 1);
        },
        error: (err) => {
          this._error.set(err?.message ?? 'Failed to create user');
        },
      })
    );
  }

  update(id: number, req: UpdateUserRequest): Observable<User> {
    this._error.set(null);
    return this.userService.update(id, req).pipe(
      tap({
        next: (user) => {
          this._users.update((list) => list.map((u) => (u.id === id ? user : u)));
          if (this._selected()?.id === id) this._selected.set(user);
        },
        error: (err) => {
          this._error.set(err?.message ?? 'Failed to update user');
        },
      })
    );
  }

  delete(id: number): Observable<void> {
    this._error.set(null);
    return this.userService.delete(id).pipe(
      tap({
        next: () => {
          this._users.update((list) => list.filter((u) => u.id !== id));
          this._totalElements.update((n) => n - 1);
          if (this._selected()?.id === id) this._selected.set(null);
        },
        error: (err) => {
          this._error.set(err?.message ?? 'Failed to delete user');
        },
      })
    );
  }
}
