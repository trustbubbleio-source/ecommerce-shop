import { Button, cn } from '@akknerds/ui';
import { ClipboardList, LayoutDashboard, LogOut, Store } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border bg-card/80 sticky top-0 z-40 border-b backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="text-primary size-5" aria-hidden />
              <div>
                <p className="text-sm font-bold leading-none">One More Rip Admin</p>
                <p className="text-muted-foreground text-xs">Catalog & sourcing</p>
              </div>
            </div>
            <nav className="ml-2 flex items-center gap-1 overflow-x-auto">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  cn(
                    'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                Products
              </NavLink>
              <NavLink
                to="/admin/want-list"
                className={({ isActive }) =>
                  cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <ClipboardList className="size-3.5" />
                Want list
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <Store className="size-4" />
                <span className="hidden sm:inline">Storefront</span>
              </Link>
            </Button>
            <span className="text-muted-foreground hidden text-xs sm:inline">{user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}
