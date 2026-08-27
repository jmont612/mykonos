// tests/components/ProductDetail.test.tsx (full file — replaces the Task 7 version)
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { ProductDetail } from '../../src/modules/products/ProductDetail';
import * as productsApi from '../../src/api/products';
import * as cartApi from '../../src/api/cart';
import type { Product } from '../../src/api/types';

vi.mock('../../src/api/products');
vi.mock('../../src/api/cart');

const sampleProduct: Product = {
  id: 'p1',
  sellerId: 's1',
  name: 'Widget',
  description: 'A fine widget',
  priceCents: 1999,
  stock: 5,
  category: 'Tools',
};

function renderProductDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/products/:id" element={<ProductDetail />} />
    </Routes>,
    { route: '/products/p1' },
  );
}

describe('ProductDetail', () => {
  it('renders the product fetched by id from the route', async () => {
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);

    renderProductDetail();

    expect(await screen.findByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('A fine widget')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
    expect(productsApi.getProduct).toHaveBeenCalledWith('p1');
  });

  it('adds the product to the cart with the chosen quantity', async () => {
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);
    vi.mocked(cartApi.addCartItem).mockResolvedValue({ ok: true });

    renderProductDetail();
    await screen.findByText('Widget');

    const quantityInput = screen.getByLabelText(/cantidad/i);
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, '2');
    await userEvent.click(screen.getByRole('button', { name: /agregar al carrito/i }));

    await waitFor(() => expect(cartApi.addCartItem).toHaveBeenCalledWith('p1', 2));
    expect(await screen.findByText('Agregado al carrito.')).toBeInTheDocument();
  });

  it('disables adding to cart when the quantity is cleared to zero', async () => {
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);
    vi.mocked(cartApi.addCartItem).mockClear();
    vi.mocked(cartApi.addCartItem).mockResolvedValue({ ok: true });

    renderProductDetail();
    await screen.findByText('Widget');

    const quantityInput = screen.getByLabelText(/cantidad/i);
    await userEvent.clear(quantityInput);

    const addButton = screen.getByRole('button', { name: /agregar al carrito/i });
    expect(addButton).toBeDisabled();

    await userEvent.click(addButton);

    expect(cartApi.addCartItem).not.toHaveBeenCalled();
  });

  it('shows an image gallery when the product has photos, and clicking a thumbnail swaps the large image', async () => {
    const productWithImages: Product = {
      ...sampleProduct,
      images: [
        { id: 'img1', url: '/uploads/products/p1/a.png', isPrimary: true },
        { id: 'img2', url: '/uploads/products/p1/b.png', isPrimary: false },
      ],
    };
    vi.mocked(productsApi.getProduct).mockResolvedValue(productWithImages);

    renderProductDetail();
    await screen.findByText('Widget');

    expect(screen.getByRole('img', { name: 'Widget' })).toHaveAttribute('src', '/uploads/products/p1/a.png');

    await userEvent.click(screen.getByRole('button', { name: 'Ver foto 2' }));

    expect(screen.getByRole('img', { name: 'Widget' })).toHaveAttribute('src', '/uploads/products/p1/b.png');
  });
});
