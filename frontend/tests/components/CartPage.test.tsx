// tests/components/CartPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { CartPage } from '../../src/modules/cart/CartPage';
import * as cartApi from '../../src/api/cart';
import * as productsApi from '../../src/api/products';
import type { CartItem, Product } from '../../src/api/types';

vi.mock('../../src/api/cart');
vi.mock('../../src/api/products');

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

describe('CartPage', () => {
  it('shows an empty-state message when the cart has no items', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue([]);

    renderWithProviders(<CartPage />);

    expect(await screen.findByText('Tu carrito está vacío.')).toBeInTheDocument();
  });

  it('renders items with resolved product names and the running total', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue([sampleItem]);
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);

    renderWithProviders(<CartPage />);

    expect(await screen.findByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('Total: $10.00')).toBeInTheDocument();
  });

  it('removes an item when "Quitar" is clicked', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue([sampleItem]);
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);
    vi.mocked(cartApi.removeCartItem).mockResolvedValue(undefined);

    renderWithProviders(<CartPage />);
    await screen.findByText('Widget');

    await userEvent.click(screen.getByRole('button', { name: /quitar/i }));

    await waitFor(() => expect(cartApi.removeCartItem).toHaveBeenCalledWith('p1'));
  });

  it('updates the quantity when the input is edited and blurred', async () => {
    vi.mocked(cartApi.getCart).mockResolvedValue([sampleItem]);
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);
    vi.mocked(cartApi.updateCartItem).mockResolvedValue({ productId: 'p1', quantity: 3 });

    renderWithProviders(<CartPage />);
    await screen.findByText('Widget');

    const quantityInput = screen.getByLabelText(/cantidad para widget/i);
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, '3');
    await userEvent.tab();

    await waitFor(() => expect(cartApi.updateCartItem).toHaveBeenCalledWith('p1', 3));
  });
});
