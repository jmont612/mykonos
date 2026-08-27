// tests/components/OrderHistoryPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { OrderHistoryPage } from '../../src/modules/orders/OrderHistoryPage';
import * as ordersApi from '../../src/api/orders';
import type { Order } from '../../src/api/types';

vi.mock('../../src/api/orders');

const sampleOrder: Order = {
  id: 'order-1234',
  buyerId: 'u1',
  totalAmountCents: 1500,
  createdAt: '2026-08-20T00:00:00.000Z',
  suborders: [],
};

describe('OrderHistoryPage', () => {
  it('shows an empty-state message when there are no orders', async () => {
    vi.mocked(ordersApi.listOrders).mockResolvedValue([]);

    renderWithProviders(<OrderHistoryPage />);

    expect(await screen.findByText('Todavía no hiciste ninguna compra.')).toBeInTheDocument();
  });

  it('renders each order with its total, linking to the order detail', async () => {
    vi.mocked(ordersApi.listOrders).mockResolvedValue([sampleOrder]);

    renderWithProviders(<OrderHistoryPage />);

    const link = await screen.findByRole('link');
    expect(link).toHaveAttribute('href', '/orders/order-1234');
    expect(link).toHaveTextContent('$15.00');
  });
});
