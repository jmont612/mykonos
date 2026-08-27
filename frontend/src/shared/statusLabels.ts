import type { SuborderStatus } from '../api/types';

export const STATUS_LABELS: Record<SuborderStatus, string> = {
  PAID: 'Pagado',
  SHIPPED: 'Enviado',
  CANCELLED: 'Cancelado',
};
