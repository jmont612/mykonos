import { useState } from 'react';
import { useProducts } from './useProducts';
import { ApiError } from '../../api/client';
import { ProductCard } from '../../shared/ProductCard';
import { PageHeader } from '../../ui/PageHeader';
import { Input } from '../../ui/Input';
import { Alert } from '../../ui/Alert';
import { LoadingState } from '../../ui/LoadingState';
import { EmptyState } from '../../ui/EmptyState';

export function ProductList() {
  const [search, setSearch] = useState('');
  const { data: products, isPending, error } = useProducts({ search: search || undefined });

  return (
    <div>
      <PageHeader title="Catálogo" />
      <Input
        type="search"
        placeholder="Buscar productos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar productos"
        className="mb-6 max-w-md"
      />
      {error && (
        <Alert variant="danger">
          {error instanceof ApiError ? error.message : 'No se pudo cargar el catálogo'}
        </Alert>
      )}
      {isPending && <LoadingState label="Cargando catálogo…" />}
      {products && products.length === 0 && <EmptyState title="No se encontraron productos." />}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products?.map((product) => (
          <ProductCard key={product.id} product={product} to={`/products/${product.id}`} />
        ))}
      </ul>
    </div>
  );
}
