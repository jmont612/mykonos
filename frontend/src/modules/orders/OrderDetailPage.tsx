// src/modules/orders/OrderDetailPage.tsx
import { useParams } from 'react-router-dom';
import { useOrder } from './useOrders';
import { formatCents } from '../../shared/formatCents';
import { ApiError } from '../../api/client';
import { STATUS_LABELS } from '../../shared/statusLabels';
import { OrderItemRow } from '../../shared/OrderItemRow';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Alert } from '../../ui/Alert';
import { LoadingState } from '../../ui/LoadingState';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isPending, error } = useOrder(id ?? '');

  if (isPending) return <LoadingState label="Cargando orden…" />;
  if (error) {
    return (
      <Alert variant="danger">
        {error instanceof ApiError ? error.message : 'No se pudo cargar la orden'}
      </Alert>
    );
  }
  if (!order) return null;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Orden #{order.id.slice(0, 8)}
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted">{new Date(order.createdAt).toLocaleString()}</p>

      <div className="flex flex-col gap-4">
        {order.suborders.map((suborder) => (
          <Card key={suborder.id} className="p-5">
            <div className="mb-2 flex items-center justify-between text-sm text-muted">
              <span>Vendedor {suborder.sellerId.slice(0, 8)}</span>
              <Badge>{STATUS_LABELS[suborder.status]}</Badge>
            </div>
            <ul>
              {suborder.orderItems.map((item) => (
                <OrderItemRow key={item.id} item={item} />
              ))}
            </ul>
            <p className="mt-3 text-right font-medium">
              Subtotal: {formatCents(suborder.subtotalCents)}
            </p>
          </Card>
        ))}
      </div>

      <p className="mt-6 font-display text-xl font-semibold">Total: {formatCents(order.totalAmountCents)}</p>
    </div>
  );
}
