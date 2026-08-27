// src/modules/checkout/CheckoutPage.tsx
import { useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { useCart } from '../cart/useCart';
import { useCheckout } from './useCheckout';
import { getProduct } from '../../api/products';
import { formatCents } from '../../shared/formatCents';
import { ApiError } from '../../api/client';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Alert } from '../../ui/Alert';
import { LoadingState } from '../../ui/LoadingState';
import { EmptyState } from '../../ui/EmptyState';
import type { CartItem, Product } from '../../api/types';

interface SellerGroup {
  sellerId: string;
  lines: { item: CartItem; product: Product }[];
}

function CheckoutItemRow({ item, product }: { item: CartItem; product: Product }) {
  return (
    <li className="flex justify-between border-b border-border py-2 text-sm last:border-b-0">
      <span>
        {product.name} × {item.quantity}
      </span>
      <span className="tabular-nums">{formatCents(item.priceCents * item.quantity)}</span>
    </li>
  );
}

export function CheckoutPage() {
  const { data: items, isPending, error } = useCart();
  const checkout = useCheckout();
  const navigate = useNavigate();

  const productQueries = useQueries({
    queries: (items ?? []).map((item) => ({
      queryKey: ['products', item.productId],
      queryFn: () => getProduct(item.productId),
    })),
  });

  if (isPending) return <LoadingState label="Cargando carrito…" />;
  if (error) {
    return (
      <Alert variant="danger">
        {error instanceof ApiError ? error.message : 'No se pudo cargar el carrito'}
      </Alert>
    );
  }

  const productsLoading = items.length > 0 && productQueries.some((query) => query.isPending);
  if (productsLoading) return <LoadingState label="Cargando carrito…" />;

  const groups: SellerGroup[] = [];
  items.forEach((item, index) => {
    const product = productQueries[index]?.data;
    if (!product) return;
    let group = groups.find((candidate) => candidate.sellerId === product.sellerId);
    if (!group) {
      group = { sellerId: product.sellerId, lines: [] };
      groups.push(group);
    }
    group.lines.push({ item, product });
  });

  const total = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  async function handleConfirm() {
    try {
      const order = await checkout.mutateAsync();
      navigate(`/orders/${order.id}`);
    } catch {
      // surfaced below via checkout.isError / checkout.error
    }
  }

  return (
    <div>
      <PageHeader title="Checkout" />
      {items.length === 0 ? (
        <EmptyState title="Tu carrito está vacío." />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {groups.map((group) => {
              const subtotal = group.lines.reduce(
                (sum, { item }) => sum + item.priceCents * item.quantity,
                0,
              );
              return (
                <Card key={group.sellerId} className="p-5">
                  <p className="mb-2 text-sm text-muted">Vendedor {group.sellerId.slice(0, 8)}</p>
                  <ul>
                    {group.lines.map(({ item, product }) => (
                      <CheckoutItemRow key={item.productId} item={item} product={product} />
                    ))}
                  </ul>
                  <p className="mt-3 text-right font-medium">Subtotal: {formatCents(subtotal)}</p>
                </Card>
              );
            })}
          </div>
          <p className="mt-6 font-display text-xl font-semibold">Total: {formatCents(total)}</p>
          {checkout.isError && (
            <div className="mt-3">
              <Alert variant="danger">
                {checkout.error instanceof ApiError
                  ? checkout.error.message
                  : 'No se pudo confirmar la compra'}
              </Alert>
            </div>
          )}
          <Button className="mt-4" onClick={handleConfirm} loading={checkout.isPending}>
            Confirmar compra
          </Button>
        </>
      )}
    </div>
  );
}
