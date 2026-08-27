import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { CheckoutPage } from '../../src/modules/checkout/CheckoutPage';
import * as cartApi from '../../src/api/cart';
import * as productsApi from '../../src/api/products';
import * as ordersApi from '../../src/api/orders';
import { ApiError } from '../../src/api/client';
import type { CartItem, Order, Product } from '../../src/api/types';

vi.mock('../../src/api/cart');
vi.mock('../../src/api/products');
vi.mock('../../src/api/orders');

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const sampleItem: CartItem = { productId: 'p1', quantity: 2, priceCents: 500 };
const sampleProduct: Product = {
  id: 'p1',
  sellerId: 's1',
  name: 'Widget',
  description: 'A fine widget',
  priceCents: 500,
  stock: 10,
  category: 'Tools',
};
const secondItem: CartItem = { productId: 'p2', quantity: 1, priceCents: 700 };
const secondProduct: Product = {
  id: 'p2',
  sellerId: 's2',
  name: 'Gadget',
  description: 'A fine gadget',
  priceCents: 700,
  stock: 3,
  category: 'Tools',
};
const sampleOrder: Order = {
  id: 'o1',
  buyerId: 'u1',
  totalAmountCents: 1000,
  createdAt: '2026-08-20T00:00:00.000Z',
  suborders: [],
};

describe('CheckoutPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('shows an empty-state message when the cart has no items', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue([]);

    renderWithProviders(<CheckoutPage />);

    expect(await screen.findByText('Tu carrito está vacío.')).toBeInTheDocument();
  });

  it('renders the order summary with resolved product names and total', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue([sampleItem]);
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);

    renderWithProviders(<CheckoutPage />);

    expect(await screen.findByText('Widget × 2')).toBeInTheDocument();
    expect(screen.getByText('Total: $10.00')).toBeInTheDocument();
  });

  it('confirms the purchase and navigates to the new order', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue([sampleItem]);
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);
    vi.mocked(ordersApi.checkout).mockResolvedValue(sampleOrder);

    renderWithProviders(<CheckoutPage />);
    await screen.findByText('Widget × 2');

    await userEvent.click(screen.getByRole('button', { name: /confirmar compra/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/orders/o1'));
  });

  it('groups a multi-seller cart into one section per seller with correct subtotals and grand total', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue([sampleItem, secondItem]);
    vi.mocked(productsApi.getProduct).mockImplementation((id: string) =>
      Promise.resolve(id === 'p1' ? sampleProduct : secondProduct),
    );

    renderWithProviders(<CheckoutPage />);

    expect(await screen.findByText('Widget × 2')).toBeInTheDocument();
    expect(screen.getByText('Gadget × 1')).toBeInTheDocument();
    expect(screen.getByText('Vendedor s1')).toBeInTheDocument();
    expect(screen.getByText('Vendedor s2')).toBeInTheDocument();

    // Two seller groups, each with its own subtotal.
    expect(screen.getByText('Subtotal: $10.00')).toBeInTheDocument();
    expect(screen.getByText('Subtotal: $7.00')).toBeInTheDocument();

    // Grand total across both groups.
    expect(screen.getByText('Total: $17.00')).toBeInTheDocument();
  });

  it('shows the backend error message when checkout fails', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue([sampleItem]);
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);
    vi.mocked(ordersApi.checkout).mockRejectedValue(new ApiError('Insufficient stock for product p1', 409));

    renderWithProviders(<CheckoutPage />);
    await screen.findByText('Widget × 2');

    await userEvent.click(screen.getByRole('button', { name: /confirmar compra/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient stock for product p1');
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
