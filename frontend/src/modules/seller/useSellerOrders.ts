// src/modules/seller/useSellerOrders.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listSellerSuborders, updateSuborderStatus } from '../../api/sellerOrders';
import type { SuborderStatus } from '../../api/types';

export function useSellerOrders() {
  return useQuery({ queryKey: ['sellerSuborders'], queryFn: listSellerSuborders });
}

export function useUpdateSuborderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SuborderStatus }) => updateSuborderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sellerSuborders'] }),
  });
}
