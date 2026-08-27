// src/api/sellerOrders.ts
import { apiRequest } from './client';
import type { Suborder, SuborderStatus } from './types';

export function listSellerSuborders() {
  return apiRequest<Suborder[]>('/api/seller/suborders', { auth: true });
}

export function updateSuborderStatus(id: string, status: SuborderStatus) {
  return apiRequest<Suborder>(`/api/seller/suborders/${id}`, {
    method: 'PATCH',
    auth: true,
    body: { status },
  });
}
