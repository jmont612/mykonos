// src/modules/orders/OrderHistoryPage.tsx
import { Link } from 'react-router-dom';
import { useOrders } from './useOrders';
import { formatCents } from '../../shared/formatCents';
import { ApiError } from '../../api/client';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';
import { Alert } from '../../ui/Alert';
import { LoadingState } from '../../ui/LoadingState';
import { EmptyState } from '../../ui/EmptyState';
import { ChevronRightIcon } from '../../ui/icons';

export function OrderHistoryPage() {
  const { data: orders, isPending, error } = useOrders();

  if (isPending) return <LoadingState label="Cargando historial…" />;
  if (error) {
    return (
      <Alert variant="danger">
        {error instanceof ApiError ? error.message : 'No se pudo cargar el historial'}
      </Alert>
    );
  }
  if (orders.length === 0) {
    return (
      <div>
        <PageHeader title="Mis Órdenes" />
        <EmptyState title="Todavía no hiciste ninguna compra." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Mis Órdenes" />
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <Card key={order.id} interactive>
            <Link
              to={`/orders/${order.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <span className="text-sm text-muted">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2 font-medium tabular-nums">
                {formatCents(order.totalAmountCents)}
                <ChevronRightIcon className="h-4 w-4 text-muted" />
              </span>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
