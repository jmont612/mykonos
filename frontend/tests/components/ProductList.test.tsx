import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { ProductList } from '../../src/modules/products/ProductList';
import * as productsApi from '../../src/api/products';
import { ApiError } from '../../src/api/client';
import type { Product } from '../../src/api/types';

vi.mock('../../src/api/products');

const sampleProduct: Product = {
  id: 'p1',
  sellerId: 's1',
  name: 'Widget',
  description: 'A fine widget',
  priceCents: 1999,
  stock: 5,
  category: 'Tools',
};

describe('ProductList', () => {
  it('renders products returned by the API', async () => {
    vi.mocked(productsApi.listProducts).mockResolvedValue([sampleProduct]);

    renderWithProviders(<ProductList />);

    expect(await screen.findByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });

  it('shows an empty-state message when there are no products', async () => {
    vi.mocked(productsApi.listProducts).mockResolvedValue([]);

    renderWithProviders(<ProductList />);

    expect(await screen.findByText('No se encontraron productos.')).toBeInTheDocument();
  });

  it('shows an error banner when the request fails', async () => {
    vi.mocked(productsApi.listProducts).mockRejectedValue(new ApiError('Request failed', 500));

    renderWithProviders(<ProductList />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Request failed'));
  });

  it('shows the primary image thumbnail when the product has images', async () => {
    const productWithImage: Product = {
      ...sampleProduct,
      images: [{ id: 'img1', url: '/uploads/products/p1/a.png', isPrimary: true }],
    };
    vi.mocked(productsApi.listProducts).mockResolvedValue([productWithImage]);

    renderWithProviders(<ProductList />);

    const img = await screen.findByRole('img', { name: 'Widget' });
    expect(img).toHaveAttribute('src', '/uploads/products/p1/a.png');
  });

  it('shows a placeholder when the product has no images', async () => {
    vi.mocked(productsApi.listProducts).mockResolvedValue([sampleProduct]);

    renderWithProviders(<ProductList />);

    expect(await screen.findByText('Sin foto')).toBeInTheDocument();
  });
});
