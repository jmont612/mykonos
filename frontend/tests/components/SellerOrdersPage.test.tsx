// tests/components/SellerOrdersPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { SellerOrdersPage } from '../../src/modules/seller/SellerOrdersPage';
import * as sellerOrdersApi from '../../src/api/sellerOrders';
import * as productsApi from '../../src/api/products';
import type { Product, Suborder } from '../../src/api/types';

vi.mock('../../src/api/sellerOrders');
vi.mock('../../src/api/products');

const sampleProduct: Product = {
  id: 'p1',
  sellerId: 'seller-1',
  name: 'Widget',
  description: 'A fine widget',
  priceCents: 500,
  stock: 10,
  category: 'Tools',
};

const sampleSuborder: Suborder = {
  id: 'sub-1',
  orderId: 'order-1234',
  sellerId: 'seller-1',
  status: 'PAID',
  subtotalCents: 1000,
  orderItems: [
    { id: 'item-1', suborderId: 'sub-1', productId: 'p1', quantity: 2, unitPriceAtPurchaseCents: 500 },
  ],
};

describe('SellerOrdersPage', () => {
  it('shows an empty-state message when there are no received orders', async () => {
    vi.mocked(sellerOrdersApi.listSellerSuborders).mockResolvedValue([]);

    renderWithProviders(<SellerOrdersPage />);

    expect(await screen.findByText('Todavía no recibiste ningún pedido.')).toBeInTheDocument();
  });

  it('lists suborders with resolved item names, status, and subtotal', async () => {
    vi.mocked(sellerOrdersApi.listSellerSuborders).mockResolvedValue([sampleSuborder]);
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);

    renderWithProviders(<SellerOrdersPage />);

    expect(await screen.findByText('Widget × 2')).toBeInTheDocument();
    expect(screen.getByText('Subtotal: $10.00')).toBeInTheDocument();
    expect(screen.getByText('Pedido #order-12')).toBeInTheDocument();
  });

  it('changes the suborder status via the select', async () => {
    vi.mocked(sellerOrdersApi.listSellerSuborders).mockResolvedValue([sampleSuborder]);
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);
    vi.mocked(sellerOrdersApi.updateSuborderStatus).mockResolvedValue({ ...sampleSuborder, status: 'SHIPPED' });

    renderWithProviders(<SellerOrdersPage />);
    await screen.findByText('Widget × 2');

    await userEvent.selectOptions(screen.getByLabelText(/estado/i), 'SHIPPED');

    await waitFor(() =>
      expect(sellerOrdersApi.updateSuborderStatus).toHaveBeenCalledWith('sub-1', 'SHIPPED'),
    );
  });
});
