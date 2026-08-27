// src/api/sellerProducts.ts
import { apiRequest } from './client';
import type { Product } from './types';

export interface CreateProductInput {
  name: string;
  description: string;
  basePriceCents: number;
  initialStock: number;
  category: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  basePriceCents?: number;
  stock?: number;
  category?: string;
}

export function createProduct(input: CreateProductInput) {
  return apiRequest<Product>('/api/products', { method: 'POST', auth: true, body: input });
}

export function updateProduct(id: string, input: UpdateProductInput) {
  return apiRequest<Product>(`/api/products/${id}`, { method: 'PATCH', auth: true, body: input });
}

export function deleteProduct(id: string) {
  return apiRequest<undefined>(`/api/products/${id}`, { method: 'DELETE', auth: true });
}
