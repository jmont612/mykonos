import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '../../src/shared/Layout';
import { useAuth } from '../../src/auth/AuthContext';

vi.mock('../../src/auth/AuthContext');

describe('Layout', () => {
  it('shows a login link when unauthenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      status: 'unauthenticated',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /carrito/i })).not.toBeInTheDocument();
  });

  it('shows buyer navigation and a logout button when authenticated', () => {
    const logout = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u1', email: 'a@b.com', name: 'Alice', role: 'BUYER' },
      status: 'authenticated',
      login: vi.fn(),
      register: vi.fn(),
      logout,
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /carrito/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /mis órdenes/i })).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('hides buyer navigation for an authenticated seller', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u2', email: 's@b.com', name: 'Sam', role: 'SELLER' },
      status: 'authenticated',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: /carrito/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /mis órdenes/i })).not.toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
  });

  it('shows the seller navigation link for an authenticated seller', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u2', email: 's@b.com', name: 'Sam', role: 'SELLER' },
      status: 'authenticated',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /pedidos recibidos/i })).toBeInTheDocument();
  });
});
