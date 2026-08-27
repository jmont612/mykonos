import { apiRequest } from './client';
import type { Product } from './types';

export interface ListProductsParams {
  category?: string;
  search?: string;
  sellerId?: string;
}

export function listProducts(params: ListProductsParams = {}) {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.search) query.set('search', params.search);
  if (params.sellerId) query.set('sellerId', params.sellerId);
  const qs = query.toString();
  return apiRequest<Product[]>(`/api/products${qs ? `?${qs}` : ''}`);
}

export function getProduct(id: string) {
  return apiRequest<Product>(`/api/products/${id}`);
}
