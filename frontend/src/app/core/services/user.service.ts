import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user.model';
import { Page } from '../models/page.model';

const API_BASE_URL = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  list(page: number = 0, size: number = 10, sort: string = 'id,asc'): Observable<Page<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);
    return this.http.get<Page<User>>(`${API_BASE_URL}/api/users`, { params });
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${API_BASE_URL}/api/users/${id}`);
  }

  create(req: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${API_BASE_URL}/api/users`, req);
  }

  update(id: number, req: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${API_BASE_URL}/api/users/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/users/${id}`);
  }
}
