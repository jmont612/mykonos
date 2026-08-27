// src/api/productImages.ts
import { apiRequest } from './client';
import type { ProductImage } from './types';

export function uploadProductImages(productId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  return apiRequest<ProductImage[]>(`/api/products/${productId}/images`, {
    method: 'POST',
    auth: true,
    body: formData,
  });
}

export function deleteProductImage(productId: string, imageId: string) {
  return apiRequest<undefined>(`/api/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export function setPrimaryProductImage(productId: string, imageId: string) {
  return apiRequest<ProductImage>(`/api/products/${productId}/images/${imageId}/primary`, {
    method: 'PATCH',
    auth: true,
  });
}
