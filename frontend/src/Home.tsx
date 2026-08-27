// src/Home.tsx
import { useAuth } from './auth/AuthContext';
import { ProductList } from './modules/products/ProductList';
import { SellerProductList } from './modules/seller/SellerProductList';

export function Home() {
  const { status, user } = useAuth();
  if (status === 'loading') return null;
  if (status === 'authenticated' && user?.role === 'SELLER') {
    return <SellerProductList />;
  }
  return <ProductList />;
}
