// tests/unit/AuthContext.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../../src/auth/AuthContext';
import * as authApi from '../../src/api/auth';

vi.mock('../../src/api/auth');

function TestConsumer() {
  const { user, status, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="user">{user ? user.email : 'none'}</div>
      <button onClick={() => login({ email: 'a@b.com', password: 'secret1' })}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function renderWithAuth() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(authApi).login = vi.fn();
    vi.mocked(authApi).register = vi.fn();
    vi.mocked(authApi).refreshAccessToken = vi.fn();
    vi.mocked(authApi).getMe = vi.fn();
  });

  it('starts unauthenticated when there is no stored refresh token', async () => {
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('bootstraps as authenticated when a refresh token is stored and refresh succeeds', async () => {
    localStorage.setItem('refreshToken', 'stored-refresh-token');
    vi.mocked(authApi.refreshAccessToken).mockResolvedValue({ accessToken: 'new-access-token' });
    vi.mocked(authApi.getMe).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'Alice',
      role: 'BUYER',
    });

    renderWithAuth();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('user')).toHaveTextContent('a@b.com');
  });

  it('clears the stored refresh token when bootstrap refresh fails', async () => {
    localStorage.setItem('refreshToken', 'stale-refresh-token');
    vi.mocked(authApi.refreshAccessToken).mockRejectedValue(new Error('expired'));

    renderWithAuth();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('login stores the refresh token and sets the user', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'BUYER' },
    });

    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));

    await userEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('user')).toHaveTextContent('a@b.com');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-1');
  });

  it('logout clears the user and the stored refresh token', async () => {
    localStorage.setItem('refreshToken', 'refresh-1');
    vi.mocked(authApi.refreshAccessToken).mockResolvedValue({ accessToken: 'access-1' });
    vi.mocked(authApi.getMe).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'Alice',
      role: 'BUYER',
    });

    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    await userEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('logout clears the TanStack Query cache so the next user does not see stale data', async () => {
    localStorage.setItem('refreshToken', 'refresh-1');
    vi.mocked(authApi.refreshAccessToken).mockResolvedValue({ accessToken: 'access-1' });
    vi.mocked(authApi.getMe).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'Alice',
      role: 'BUYER',
    });

    const { queryClient } = renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    queryClient.setQueryData(['cart'], [{ productId: 'p1', quantity: 1, priceCents: 100 }]);
    expect(queryClient.getQueryData(['cart'])).toBeDefined();

    await userEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(queryClient.getQueryData(['cart'])).toBeUndefined();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});
