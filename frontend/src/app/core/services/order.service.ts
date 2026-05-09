import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, CreateOrderRequest, UpdateOrderRequest } from '../models/order.model';
import { Page } from '../models/page.model';

const API_BASE_URL = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  list(
    page: number = 0,
    size: number = 20,
    sort: string = 'createdAt,desc',
    status?: string,
    dateFrom?: string,
    dateTo?: string,
    q?: string
  ): Observable<Page<Order>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);
    if (status) params = params.set('status', status);
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);
    if (q) params = params.set('customerName', q);
    return this.http.get<Page<Order>>(`${API_BASE_URL}/api/orders`, { params });
  }

  getById(id: number): Observable<Order> {
    return this.http.get<Order>(`${API_BASE_URL}/api/orders/${id}`);
  }

  create(req: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${API_BASE_URL}/api/orders`, req);
  }

  update(id: number, req: UpdateOrderRequest): Observable<Order> {
    return this.http.put<Order>(`${API_BASE_URL}/api/orders/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/orders/${id}`);
  }
}
