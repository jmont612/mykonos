// src/modules/cart/CartPage.tsx
import { Link } from 'react-router-dom';
import { useCart } from './useCart';
import { CartItemRow } from './CartItemRow';
import { formatCents } from '../../shared/formatCents';
import { ApiError } from '../../api/client';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';
import { Alert } from '../../ui/Alert';
import { LoadingState } from '../../ui/LoadingState';
import { EmptyState } from '../../ui/EmptyState';
import { CartIcon } from '../../ui/icons';

export function CartPage() {
  const { data: items, isPending, error } = useCart();

  if (isPending) return <LoadingState label="Cargando carrito…" />;
  if (error) {
    return (
      <Alert variant="danger">
        {error instanceof ApiError ? error.message : 'No se pudo cargar el carrito'}
      </Alert>
    );
  }

  const total = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  return (
    <div>
      <PageHeader title="Carrito" />
      {items.length === 0 ? (
        <EmptyState icon={<CartIcon className="h-5 w-5" />} title="Tu carrito está vacío." />
      ) : (
        <>
          <Card>
            <ul className="divide-y divide-border px-5">
              {items.map((item) => (
                <CartItemRow key={item.productId} item={item} />
              ))}
            </ul>
          </Card>
          <div className="mt-6 flex items-center justify-between">
            <p className="font-display text-xl font-semibold">Total: {formatCents(total)}</p>
            <Link to="/checkout" className="btn btn-primary btn-md">
              Ir a pagar
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
