import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  getApiUrl(): string {
    return API_BASE_URL;
  }

  login(username: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(
      `${API_BASE_URL}/api/auth/login`,
      { username, password }
    );
  }
}
