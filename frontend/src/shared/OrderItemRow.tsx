// src/shared/OrderItemRow.tsx
import { useProduct } from '../modules/products/useProducts';
import { formatCents } from './formatCents';
import type { OrderItem } from '../api/types';

export function OrderItemRow({ item }: { item: OrderItem }) {
  const { data: product } = useProduct(item.productId);
  return (
    <li className="flex justify-between py-1.5 text-sm">
      <span>
        {product?.name ?? item.productId} × {item.quantity}
      </span>
      <span className="tabular-nums">{formatCents(item.unitPriceAtPurchaseCents * item.quantity)}</span>
    </li>
  );
}
