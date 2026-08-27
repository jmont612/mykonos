// src/api/cart.ts
import { apiRequest } from './client';
import type { CartItem } from './types';

export function getCart() {
  return apiRequest<CartItem[]>('/api/cart', { auth: true });
}

export function addCartItem(productId: string, quantity: number) {
  return apiRequest<{ ok: true }>('/api/cart/items', {
    method: 'POST',
    auth: true,
    body: { productId, quantity },
  });
}

export function updateCartItem(productId: string, quantity: number) {
  return apiRequest<{ productId: string; quantity: number }>(`/api/cart/items/${productId}`, {
    method: 'PATCH',
    auth: true,
    body: { quantity },
  });
}

export function removeCartItem(productId: string) {
  return apiRequest<undefined>(`/api/cart/items/${productId}`, {
    method: 'DELETE',
    auth: true,
  });
}
