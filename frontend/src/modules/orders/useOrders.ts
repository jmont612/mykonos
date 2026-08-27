// src/modules/orders/useOrders.ts
import { useQuery } from '@tanstack/react-query';
import { getOrder, listOrders } from '../../api/orders';

export function useOrders() {
  return useQuery({ queryKey: ['orders'], queryFn: listOrders });
}

export function useOrder(id: string) {
  return useQuery({ queryKey: ['orders', id], queryFn: () => getOrder(id), enabled: Boolean(id) });
}
