import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from '../../src/modules/auth/RegisterPage';
import { useAuth } from '../../src/auth/AuthContext';
import { ApiError } from '../../src/api/client';

vi.mock('../../src/auth/AuthContext');

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

describe('RegisterPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('submits the form with the selected role and navigates home on success', async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      status: 'unauthenticated',
      login: vi.fn(),
      register,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/nombre/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'secret1');
    await userEvent.selectOptions(screen.getByLabelText(/rol/i), 'BUYER');
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(register).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret1',
      name: 'Alice',
      role: 'BUYER',
    });
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('shows the backend error message when registration fails', async () => {
    const register = vi.fn().mockRejectedValue(new ApiError('Email already registered', 409));
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      status: 'unauthenticated',
      login: vi.fn(),
      register,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/nombre/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'secret1');
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered');
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
