import { CustomerSummary } from './customer.model';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: '#fff3e0',
  PROCESSING: '#e3f2fd',
  COMPLETED: '#e8f5e9',
  CANCELLED: '#fbe9e7',
};

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
