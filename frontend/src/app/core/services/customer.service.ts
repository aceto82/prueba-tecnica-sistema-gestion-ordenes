import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../models/customer.model';
import { Page } from '../models/page.model';

const API_BASE_URL = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);

  list(page: number = 0, size: number = 20, sort: string = 'name,asc'): Observable<Page<Customer>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);
    return this.http.get<Page<Customer>>(`${API_BASE_URL}/api/customers`, { params });
  }

  getById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${API_BASE_URL}/api/customers/${id}`);
  }

  create(req: CreateCustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(`${API_BASE_URL}/api/customers`, req);
  }

  update(id: number, req: UpdateCustomerRequest): Observable<Customer> {
    return this.http.put<Customer>(`${API_BASE_URL}/api/customers/${id}`, req);
  }
}
