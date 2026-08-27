// src/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { Role } from '../api/types';

const ROLE_LABELS: Record<Role, string> = {
  BUYER: 'compradores',
  SELLER: 'vendedores',
};

export function ProtectedRoute({ role }: { role: Role }) {
  const { status, user } = useAuth();

  if (status === 'loading') return null;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  if (user?.role !== role) {
    return <p>Esta sección es solo para {ROLE_LABELS[role]} por el momento.</p>;
  }
  return <Outlet />;
}
