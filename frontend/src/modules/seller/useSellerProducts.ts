// src/modules/seller/useSellerProducts.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listProducts } from '../../api/products';
import { createProduct, deleteProduct, updateProduct } from '../../api/sellerProducts';
import type { CreateProductInput, UpdateProductInput } from '../../api/sellerProducts';
import { deleteProductImage, setPrimaryProductImage, uploadProductImages } from '../../api/productImages';

export function useSellerProducts(sellerId: string) {
  return useQuery({
    queryKey: ['products', { sellerId }],
    queryFn: () => listProducts({ sellerId }),
    enabled: Boolean(sellerId),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) => updateProduct(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUploadProductImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, files }: { productId: string; files: File[] }) =>
      uploadProductImages(productId, files),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      deleteProductImage(productId, imageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useSetPrimaryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, imageId }: { productId: string; imageId: string }) =>
      setPrimaryProductImage(productId, imageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}
