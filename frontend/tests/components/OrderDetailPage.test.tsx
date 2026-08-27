// tests/components/OrderDetailPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { OrderDetailPage } from '../../src/modules/orders/OrderDetailPage';
import * as ordersApi from '../../src/api/orders';
import * as productsApi from '../../src/api/products';
import type { Order, Product } from '../../src/api/types';

vi.mock('../../src/api/orders');
vi.mock('../../src/api/products');

const sampleProduct: Product = {
  id: 'p1',
  sellerId: 's1',
  name: 'Widget',
  description: 'A fine widget',
  priceCents: 500,
  stock: 10,
  category: 'Tools',
};

const sampleOrder: Order = {
  id: 'order-1234',
  buyerId: 'u1',
  totalAmountCents: 1000,
  createdAt: '2026-08-20T00:00:00.000Z',
  suborders: [
    {
      id: 'sub-1',
      orderId: 'order-1234',
      sellerId: 'seller-5678',
      status: 'PAID',
      subtotalCents: 1000,
      orderItems: [
        {
          id: 'item-1',
          suborderId: 'sub-1',
          productId: 'p1',
          quantity: 2,
          unitPriceAtPurchaseCents: 500,
        },
      ],
    },
  ],
};

describe('OrderDetailPage', () => {
  it('renders suborders grouped with resolved item names, status, and totals', async () => {
    vi.mocked(ordersApi.getOrder).mockResolvedValue(sampleOrder);
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);

    renderWithProviders(
      <Routes>
        <Route path="/orders/:id" element={<OrderDetailPage />} />
      </Routes>,
      { route: '/orders/order-1234' },
    );

    expect(await screen.findByText('Widget × 2')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(screen.getByText('Subtotal: $10.00')).toBeInTheDocument();
    expect(screen.getByText('Total: $10.00')).toBeInTheDocument();
    expect(ordersApi.getOrder).toHaveBeenCalledWith('order-1234');
  });
});
