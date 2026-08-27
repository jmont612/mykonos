// src/modules/cart/CartItemRow.tsx
import { useEffect, useState } from 'react';
import { useProduct } from '../products/useProducts';
import { useRemoveCartItem, useUpdateCartItem } from './useCart';
import { formatCents } from '../../shared/formatCents';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import type { CartItem } from '../../api/types';

export function CartItemRow({ item }: { item: CartItem }) {
  const { data: product } = useProduct(item.productId);
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const [quantityInput, setQuantityInput] = useState(String(item.quantity));

  useEffect(() => {
    setQuantityInput(String(item.quantity));
  }, [item.quantity]);

  function commitQuantity() {
    const quantity = Number(quantityInput);
    if (quantity > 0 && quantity !== item.quantity) {
      updateCartItem.mutate({ productId: item.productId, quantity });
    } else {
      setQuantityInput(String(item.quantity));
    }
  }

  const label = product?.name ?? item.productId;

  return (
    <li className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted">{formatCents(item.priceCents)} c/u</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1">
          <span className="sr-only">Cantidad para {label}</span>
          <Input
            type="number"
            min={1}
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            onBlur={commitQuantity}
            className="w-16"
          />
        </label>
        <p className="w-24 text-right tabular-nums">{formatCents(item.priceCents * item.quantity)}</p>
        <Button variant="ghost" size="sm" onClick={() => removeCartItem.mutate(item.productId)}>
          Quitar
        </Button>
      </div>
    </li>
  );
}
