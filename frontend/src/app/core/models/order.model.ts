import { CustomerSummary } from './customer.model';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: number;
  status: OrderStatus;
  total: number;
  createdAt: string;
  customer: CustomerSummary;
}

export interface CreateOrderRequest {
  customerId: number;
  total: number;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  total?: number;
}
