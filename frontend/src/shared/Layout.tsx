import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { cn } from '../ui/cn';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'text-sm font-medium transition-colors hover:text-fg',
    isActive ? 'text-fg' : 'text-muted',
  );

export function Layout() {
  const { user, status, logout } = useAuth();
  const isBuyer = status === 'authenticated' && user?.role === 'BUYER';
  const isSeller = status === 'authenticated' && user?.role === 'SELLER';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-surface backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--color-surface)_80%,transparent)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_4px_var(--color-ring)]" />
            Mykonos
          </Link>
          <nav className="flex items-center gap-4">
            {status === 'authenticated' && user ? (
              <>
                {isBuyer && (
                  <>
                    <NavLink to="/cart" className={navLinkClass}>
                      Carrito
                    </NavLink>
                    <NavLink to="/orders" className={navLinkClass}>
                      Mis Órdenes
                    </NavLink>
                  </>
                )}
                {isSeller && (
                  <NavLink to="/seller/orders" className={navLinkClass}>
                    Pedidos recibidos
                  </NavLink>
                )}
                <span className="ui-pill hidden sm:inline-flex">{user.name}</span>
                <ThemeToggle />
                <Button variant="ghost" size="sm" onClick={logout}>
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <>
                <ThemeToggle />
                <NavLink to="/login" className={navLinkClass}>
                  Iniciar sesión
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
