// tests/components/SellerProductList.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { SellerProductList } from '../../src/modules/seller/SellerProductList';
import { useAuth } from '../../src/auth/AuthContext';
import * as productsApi from '../../src/api/products';
import type { Product } from '../../src/api/types';

vi.mock('../../src/auth/AuthContext');
vi.mock('../../src/api/products');

const sellerUser = { id: 'seller-1', email: 's@b.com', name: 'Sam', role: 'SELLER' as const };

function mockAuthenticatedSeller() {
  vi.mocked(useAuth).mockReturnValue({
    user: sellerUser,
    status: 'authenticated',
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  });
}

const sampleProduct: Product = {
  id: 'p1',
  sellerId: 'seller-1',
  name: 'Widget',
  description: 'A fine widget',
  priceCents: 500,
  stock: 10,
  category: 'Tools',
};

describe('SellerProductList', () => {
  it('shows an empty-state message when the seller has no products', async () => {
    mockAuthenticatedSeller();
    vi.mocked(productsApi.listProducts).mockResolvedValue([]);

    renderWithProviders(<SellerProductList />);

    expect(await screen.findByText('Todavía no publicaste ningún producto.')).toBeInTheDocument();
  });

  it("lists the seller's own products, scoped by sellerId", async () => {
    mockAuthenticatedSeller();
    vi.mocked(productsApi.listProducts).mockResolvedValue([sampleProduct]);

    renderWithProviders(<SellerProductList />);

    expect(await screen.findByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
    expect(screen.getByText('Stock 10')).toBeInTheDocument();
    expect(productsApi.listProducts).toHaveBeenCalledWith({ sellerId: 'seller-1' });
  });

  it('links to the new-product form', async () => {
    mockAuthenticatedSeller();
    vi.mocked(productsApi.listProducts).mockResolvedValue([]);

    renderWithProviders(<SellerProductList />);
    await screen.findByText('Todavía no publicaste ningún producto.');

    expect(screen.getByRole('link', { name: /nuevo producto/i })).toHaveAttribute(
      'href',
      '/seller/products/new',
    );
  });

  it('shows the primary image thumbnail when the product has images', async () => {
    mockAuthenticatedSeller();
    const productWithImage: Product = {
      ...sampleProduct,
      images: [{ id: 'img1', url: '/uploads/products/p1/a.png', isPrimary: true }],
    };
    vi.mocked(productsApi.listProducts).mockResolvedValue([productWithImage]);

    renderWithProviders(<SellerProductList />);

    const img = await screen.findByRole('img', { name: 'Widget' });
    expect(img).toHaveAttribute('src', '/uploads/products/p1/a.png');
  });

  it('shows a placeholder when the product has no images', async () => {
    mockAuthenticatedSeller();
    vi.mocked(productsApi.listProducts).mockResolvedValue([sampleProduct]);

    renderWithProviders(<SellerProductList />);

    expect(await screen.findByText('Sin foto')).toBeInTheDocument();
  });
});
