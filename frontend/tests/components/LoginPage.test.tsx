import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../../src/modules/auth/LoginPage';
import { useAuth } from '../../src/auth/AuthContext';
import { ApiError } from '../../src/api/client';

vi.mock('../../src/auth/AuthContext');

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

describe('LoginPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('submits the form and navigates home on success', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      status: 'unauthenticated',
      login,
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'secret1');
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret1' });
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('shows the backend error message when login fails', async () => {
    const login = vi.fn().mockRejectedValue(new ApiError('Invalid credentials', 401));
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      status: 'unauthenticated',
      login,
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
