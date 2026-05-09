import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE_URL = 'http://localhost:8080';

export interface DashboardStats {
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  totalRevenue: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${API_BASE_URL}/api/dashboard/stats`);
  }
}