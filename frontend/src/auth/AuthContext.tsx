// src/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getMe, login as loginApi, refreshAccessToken, register as registerApi } from '../api/auth';
import { setAccessToken, setRefreshHandler, setUnauthorizedHandler } from '../api/client';
import type { Role, User } from '../api/types';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  status: Status;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { email: string; password: string; name: string; role: Role }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const REFRESH_TOKEN_KEY = 'refreshToken';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function clearSession() {
    setAccessToken(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    setStatus('unauthenticated');
    queryClient.clear();
  }

  useEffect(() => {
    setRefreshHandler(async () => {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) throw new Error('No refresh token stored');
      const { accessToken } = await refreshAccessToken(storedRefreshToken);
      setAccessToken(accessToken);
      return accessToken;
    });

    setUnauthorizedHandler(() => {
      clearSession();
      navigate('/login');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) {
      setStatus('unauthenticated');
      return;
    }
    refreshAccessToken(storedRefreshToken)
      .then(({ accessToken }) => {
        setAccessToken(accessToken);
        return getMe();
      })
      .then((fetchedUser) => {
        setUser(fetchedUser);
        setStatus('authenticated');
      })
      .catch(() => {
        clearSession();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(input: { email: string; password: string }) {
    const response = await loginApi(input);
    setAccessToken(response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    setUser(response.user);
    setStatus('authenticated');
  }

  async function register(input: { email: string; password: string; name: string; role: Role }) {
    const response = await registerApi(input);
    setAccessToken(response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    setUser(response.user);
    setStatus('authenticated');
  }

  function logout() {
    clearSession();
  }

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
