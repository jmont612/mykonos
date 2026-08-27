import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from '../../src/shared/ProductCard';
import type { Product } from '../../src/api/types';

const product: Product = {
  id: 'p1',
  sellerId: 's1',
  name: 'Widget',
  description: 'A fine widget',
  priceCents: 1999,
  stock: 2,
  category: 'Tools',
};

function renderCard(to: string) {
  return render(
    <MemoryRouter>
      <ul>
        <ProductCard product={product} to={to} />
      </ul>
    </MemoryRouter>,
  );
}

describe('ProductCard', () => {
  it('renders name, category, price and a stock badge inside a link to `to`', () => {
    renderCard('/products/p1');

    const link = screen.getByRole('link', { name: /widget/i });
    expect(link).toHaveAttribute('href', '/products/p1');
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
    expect(screen.getByText('Quedan 2')).toBeInTheDocument();
  });

  it('points the link wherever `to` says', () => {
    renderCard('/seller/products/p1/edit');
    expect(screen.getByRole('link', { name: /widget/i })).toHaveAttribute(
      'href',
      '/seller/products/p1/edit',
    );
  });
});
