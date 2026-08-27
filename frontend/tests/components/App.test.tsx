// tests/components/App.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from '../../src/App';
import { useAuth } from '../../src/auth/AuthContext';
import * as productsApi from '../../src/api/products';
import * as cartApi from '../../src/api/cart';
import * as ordersApi from '../../src/api/orders';
import * as sellerOrdersApi from '../../src/api/sellerOrders';

// App renders Layout + ProtectedRoute, both of which call useAuth() directly;
// mock it the same way Layout.test.tsx and the page tests do.
vi.mock('../../src/auth/AuthContext');
// Mock the api/* modules so the pages behind each route don't hit real
// fetch/network calls — we're testing ROUTING here, not page content.
vi.mock('../../src/api/products');
vi.mock('../../src/api/cart');
vi.mock('../../src/api/orders');
vi.mock('../../src/api/sellerOrders');

function renderApp(route: string) {
  // <App/> itself renders <Routes>, so we wrap it directly in MemoryRouter +
  // QueryClientProvider rather than reusing renderWithProviders (which would
  // nest a second MemoryRouter).
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App routing', () => {
  beforeEach(() => {
    vi.mocked(productsApi.listProducts).mockResolvedValue([]);
    vi.mocked(cartApi.getCart).mockResolvedValue([]);
    vi.mocked(ordersApi.listOrders).mockResolvedValue([]);
    vi.mocked(sellerOrdersApi.listSellerSuborders).mockResolvedValue([]);
  });

  it('redirects an unauthenticated user hitting a protected route to the login form', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      status: 'unauthenticated',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderApp('/cart');

    expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('renders the cart page shell (not a redirect) for an authenticated buyer', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'BUYER' },
      status: 'authenticated',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderApp('/cart');

    expect(await screen.findByRole('heading', { name: /carrito/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /iniciar sesión/i })).not.toBeInTheDocument();
  });

  it('renders the catalog at the root route', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      status: 'unauthenticated',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderApp('/');

    expect(await screen.findByRole('heading', { name: /catálogo/i })).toBeInTheDocument();
  });

  it('shows a buyer-only message (not the cart, not a login redirect) for an authenticated seller', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u2', email: 's@b.com', name: 'Sam', role: 'SELLER' },
      status: 'authenticated',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderApp('/cart');

    expect(await screen.findByText(/solo para compradores/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /carrito/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /iniciar sesión/i })).not.toBeInTheDocument();
  });

  it('renders the seller product panel at the root route for an authenticated seller', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'seller-1', email: 's@b.com', name: 'Sam', role: 'SELLER' },
      status: 'authenticated',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderApp('/');

    expect(await screen.findByRole('heading', { name: /mis productos/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /catálogo/i })).not.toBeInTheDocument();
  });

  it('blocks an authenticated buyer from a seller-only route', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'BUYER' },
      status: 'authenticated',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderApp('/seller/orders');

    expect(await screen.findByText(/solo para vendedores/i)).toBeInTheDocument();
  });

  it('renders the seller orders page for an authenticated seller', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'seller-1', email: 's@b.com', name: 'Sam', role: 'SELLER' },
      status: 'authenticated',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    // SellerOrdersPage skips its heading on the empty-state early return
    // (same convention as OrderHistoryPage), so this route needs a non-empty
    // list to reach the heading — the default beforeEach mock resolves [].
    vi.mocked(sellerOrdersApi.listSellerSuborders).mockResolvedValue([
      {
        id: 'sub-1',
        orderId: 'order-1234',
        sellerId: 'seller-1',
        status: 'PAID',
        subtotalCents: 1000,
        orderItems: [],
      },
    ]);

    renderApp('/seller/orders');

    expect(await screen.findByRole('heading', { name: /pedidos recibidos/i })).toBeInTheDocument();
  });
});
