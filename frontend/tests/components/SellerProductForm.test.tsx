// tests/components/SellerProductForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { SellerProductForm } from '../../src/modules/seller/SellerProductForm';
import * as productsApi from '../../src/api/products';
import * as sellerProductsApi from '../../src/api/sellerProducts';
import * as productImagesApi from '../../src/api/productImages';
import type { Product, ProductImage } from '../../src/api/types';

vi.mock('../../src/api/products');
vi.mock('../../src/api/sellerProducts');
vi.mock('../../src/api/productImages');

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const sampleProduct: Product = {
  id: 'p1',
  sellerId: 'seller-1',
  name: 'Widget',
  description: 'A fine widget',
  priceCents: 500,
  stock: 10,
  category: 'Tools',
};

const sampleImage: ProductImage = { id: 'img1', url: '/uploads/products/p1/a.png', isPrimary: true };

function renderNewForm() {
  return renderWithProviders(
    <Routes>
      <Route path="/seller/products/new" element={<SellerProductForm />} />
    </Routes>,
    { route: '/seller/products/new' },
  );
}

function renderEditForm() {
  return renderWithProviders(
    <Routes>
      <Route path="/seller/products/:id/edit" element={<SellerProductForm />} />
    </Routes>,
    { route: '/seller/products/p1/edit' },
  );
}

describe('SellerProductForm', () => {
  beforeEach(() => {
    // Clears call history (not mock implementations) on every vi.mock'd fn,
    // including navigateMock — needed because the "dismissed confirmation"
    // test below asserts deleteProduct/navigate were NOT called, which
    // would false-fail from an earlier test's calls otherwise.
    vi.clearAllMocks();
  });

  it('creates a product from the new-product form', async () => {
    vi.mocked(sellerProductsApi.createProduct).mockResolvedValue(sampleProduct);

    renderNewForm();

    await userEvent.type(screen.getByLabelText(/nombre/i), 'Widget');
    await userEvent.type(screen.getByLabelText(/descripción/i), 'A fine widget');
    await userEvent.type(screen.getByLabelText(/categoría/i), 'Tools');
    await userEvent.type(screen.getByLabelText(/precio/i), '5.00');
    await userEvent.type(screen.getByLabelText(/stock/i), '10');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() =>
      expect(sellerProductsApi.createProduct).toHaveBeenCalledWith({
        name: 'Widget',
        description: 'A fine widget',
        category: 'Tools',
        basePriceCents: 500,
        initialStock: 10,
      }),
    );
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('prefills the edit form with the fetched product and submits an update', async () => {
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);
    vi.mocked(sellerProductsApi.updateProduct).mockResolvedValue(sampleProduct);

    renderEditForm();

    expect(await screen.findByDisplayValue('Widget')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A fine widget')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tools')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5.00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText(/stock/i));
    await userEvent.type(screen.getByLabelText(/stock/i), '7');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() =>
      expect(sellerProductsApi.updateProduct).toHaveBeenCalledWith('p1', {
        name: 'Widget',
        description: 'A fine widget',
        category: 'Tools',
        stock: 7,
      }),
    );
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('submits an update with basePriceCents when the price field is edited', async () => {
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);
    vi.mocked(sellerProductsApi.updateProduct).mockResolvedValue(sampleProduct);

    renderEditForm();

    expect(await screen.findByDisplayValue('Widget')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText(/precio/i));
    await userEvent.type(screen.getByLabelText(/precio/i), '12.50');
    await userEvent.clear(screen.getByLabelText(/stock/i));
    await userEvent.type(screen.getByLabelText(/stock/i), '7');
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() =>
      expect(sellerProductsApi.updateProduct).toHaveBeenCalledWith('p1', {
        name: 'Widget',
        description: 'A fine widget',
        category: 'Tools',
        basePriceCents: 1250,
        stock: 7,
      }),
    );
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('deletes the product after confirmation', async () => {
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);
    vi.mocked(sellerProductsApi.deleteProduct).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderEditForm();
    await screen.findByDisplayValue('Widget');

    await userEvent.click(screen.getByRole('button', { name: /eliminar producto/i }));

    await waitFor(() => expect(sellerProductsApi.deleteProduct).toHaveBeenCalledWith('p1'));
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('does not delete when the confirmation is dismissed', async () => {
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderEditForm();
    await screen.findByDisplayValue('Widget');

    await userEvent.click(screen.getByRole('button', { name: /eliminar producto/i }));

    expect(sellerProductsApi.deleteProduct).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('uploads selected photos', async () => {
    vi.mocked(productsApi.getProduct).mockResolvedValue(sampleProduct);
    vi.mocked(productImagesApi.uploadProductImages).mockResolvedValue([sampleImage]);

    renderEditForm();
    await screen.findByDisplayValue('Widget');

    const file = new File(['fake'], 'photo.png', { type: 'image/png' });
    const input = screen.getByLabelText(/seleccionar fotos/i);
    await userEvent.upload(input, file);
    await userEvent.click(screen.getByRole('button', { name: /subir fotos/i }));

    await waitFor(() =>
      expect(productImagesApi.uploadProductImages).toHaveBeenCalledWith('p1', [file]),
    );
  });

  it('deletes a photo after confirmation', async () => {
    vi.mocked(productsApi.getProduct).mockResolvedValue({ ...sampleProduct, images: [sampleImage] });
    vi.mocked(productImagesApi.deleteProductImage).mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderEditForm();
    await screen.findByDisplayValue('Widget');

    await userEvent.click(screen.getByRole('button', { name: /eliminar foto/i }));

    await waitFor(() =>
      expect(productImagesApi.deleteProductImage).toHaveBeenCalledWith('p1', 'img1'),
    );
  });

  it('marks a non-primary photo as primary', async () => {
    const secondary: ProductImage = { id: 'img2', url: '/uploads/products/p1/b.png', isPrimary: false };
    vi.mocked(productsApi.getProduct).mockResolvedValue({ ...sampleProduct, images: [sampleImage, secondary] });
    vi.mocked(productImagesApi.setPrimaryProductImage).mockResolvedValue({ ...secondary, isPrimary: true });

    renderEditForm();
    await screen.findByDisplayValue('Widget');

    await userEvent.click(screen.getByRole('button', { name: /usar como principal/i }));

    await waitFor(() =>
      expect(productImagesApi.setPrimaryProductImage).toHaveBeenCalledWith('p1', 'img2'),
    );
  });

  it('disables the file input and upload button at the 5-image limit', async () => {
    const fiveImages: ProductImage[] = Array.from({ length: 5 }, (_, i) => ({
      id: `img${i}`,
      url: `/uploads/products/p1/${i}.png`,
      isPrimary: i === 0,
    }));
    vi.mocked(productsApi.getProduct).mockResolvedValue({ ...sampleProduct, images: fiveImages });

    renderEditForm();
    await screen.findByDisplayValue('Widget');

    expect(screen.getByLabelText(/seleccionar fotos/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /subir fotos/i })).toBeDisabled();
  });
});
