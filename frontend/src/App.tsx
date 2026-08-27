import { Route, Routes } from 'react-router-dom';
import { Layout } from './shared/Layout';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Home } from './Home';
import { LoginPage } from './modules/auth/LoginPage';
import { RegisterPage } from './modules/auth/RegisterPage';
import { ProductDetail } from './modules/products/ProductDetail';
import { CartPage } from './modules/cart/CartPage';
import { CheckoutPage } from './modules/checkout/CheckoutPage';
import { OrderHistoryPage } from './modules/orders/OrderHistoryPage';
import { OrderDetailPage } from './modules/orders/OrderDetailPage';
import { SellerProductForm } from './modules/seller/SellerProductForm';
import { SellerOrdersPage } from './modules/seller/SellerOrdersPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute role="BUYER" />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Route>
        <Route element={<ProtectedRoute role="SELLER" />}>
          <Route path="/seller/products/new" element={<SellerProductForm />} />
          <Route path="/seller/products/:id/edit" element={<SellerProductForm />} />
          <Route path="/seller/orders" element={<SellerOrdersPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
