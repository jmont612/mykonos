// src/modules/seller/SellerOrdersPage.tsx
import { useSellerOrders, useUpdateSuborderStatus } from './useSellerOrders';
import { formatCents } from '../../shared/formatCents';
import { STATUS_LABELS } from '../../shared/statusLabels';
import { ApiError } from '../../api/client';
import type { Suborder, SuborderStatus } from '../../api/types';
import { OrderItemRow } from '../../shared/OrderItemRow';
import { PageHeader } from '../../ui/PageHeader';
import { Card } from '../../ui/Card';
import { Select } from '../../ui/Select';
import { Alert } from '../../ui/Alert';
import { LoadingState } from '../../ui/LoadingState';
import { EmptyState } from '../../ui/EmptyState';

function SuborderCard({ suborder }: { suborder: Suborder }) {
  const updateStatus = useUpdateSuborderStatus();

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm text-muted">
        <span>Pedido #{suborder.orderId.slice(0, 8)}</span>
        <label className="flex items-center gap-2">
          <span>Estado</span>
          <Select
            value={suborder.status}
            onChange={(e) => updateStatus.mutate({ id: suborder.id, status: e.target.value as SuborderStatus })}
            disabled={updateStatus.isPending}
            className="w-auto"
          >
            {(Object.keys(STATUS_LABELS) as SuborderStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <ul>
        {suborder.orderItems.map((item) => (
          <OrderItemRow key={item.id} item={item} />
        ))}
      </ul>
      <p className="mt-3 text-right font-medium">Subtotal: {formatCents(suborder.subtotalCents)}</p>
      {updateStatus.isError && (
        <div className="mt-3">
          <Alert variant="danger">
            {updateStatus.error instanceof ApiError
              ? updateStatus.error.message
              : 'No se pudo actualizar el estado'}
          </Alert>
        </div>
      )}
    </Card>
  );
}

export function SellerOrdersPage() {
  const { data: suborders, isPending, error } = useSellerOrders();

  if (isPending) return <LoadingState label="Cargando pedidos…" />;
  if (error) {
    return (
      <Alert variant="danger">
        {error instanceof ApiError ? error.message : 'No se pudieron cargar los pedidos'}
      </Alert>
    );
  }
  if (suborders.length === 0) {
    return (
      <div>
        <PageHeader title="Pedidos recibidos" />
        <EmptyState title="Todavía no recibiste ningún pedido." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Pedidos recibidos" />
      <div className="flex flex-col gap-4">
        {suborders.map((suborder) => (
          <SuborderCard key={suborder.id} suborder={suborder} />
        ))}
      </div>
    </div>
  );
}
