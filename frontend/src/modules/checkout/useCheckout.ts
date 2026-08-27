// src/modules/checkout/useCheckout.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkout } from '../../api/orders';

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
