// src/api/auth.ts
import { apiRequest } from './client';
import type { AuthResponse, RefreshResponse, Role, User } from './types';

export function register(input: { email: string; password: string; name: string; role: Role }) {
  return apiRequest<AuthResponse>('/api/auth/register', { method: 'POST', body: input });
}

export function login(input: { email: string; password: string }) {
  return apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: input });
}

export function refreshAccessToken(refreshToken: string) {
  return apiRequest<RefreshResponse>('/api/auth/refresh', { method: 'POST', body: { refreshToken } });
}

export function getMe() {
  return apiRequest<User>('/api/auth/me', { auth: true });
}
