// src/api/orders.ts
import { apiRequest } from './client';
import type { Order } from './types';

export function checkout() {
  return apiRequest<Order>('/api/orders/checkout', { method: 'POST', auth: true });
}

export function listOrders() {
  return apiRequest<Order[]>('/api/orders', { auth: true });
}

export function getOrder(id: string) {
  return apiRequest<Order>(`/api/orders/${id}`, { auth: true });
}
