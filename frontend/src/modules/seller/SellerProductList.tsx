import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useSellerProducts } from './useSellerProducts';
import { ApiError } from '../../api/client';
import { ProductCard } from '../../shared/ProductCard';
import { PageHeader } from '../../ui/PageHeader';
import { Alert } from '../../ui/Alert';
import { LoadingState } from '../../ui/LoadingState';
import { EmptyState } from '../../ui/EmptyState';

export function SellerProductList() {
  const { user } = useAuth();
  const { data: products, isPending, error } = useSellerProducts(user?.id ?? '');

  return (
    <div>
      <PageHeader
        title="Mis Productos"
        action={
          <Link to="/seller/products/new" className="btn btn-primary btn-sm">
            Nuevo producto
          </Link>
        }
      />
      {error && (
        <Alert variant="danger">
          {error instanceof ApiError ? error.message : 'No se pudieron cargar tus productos'}
        </Alert>
      )}
      {isPending && <LoadingState label="Cargando productos…" />}
      {products && products.length === 0 && (
        <EmptyState title="Todavía no publicaste ningún producto." />
      )}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            to={`/seller/products/${product.id}/edit`}
          />
        ))}
      </ul>
    </div>
  );
}
