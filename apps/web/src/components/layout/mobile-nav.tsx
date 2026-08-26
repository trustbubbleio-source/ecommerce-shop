import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  cn,
} from '@akknerds/ui';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ACCOUNT_NAV } from '../../config/account';
import { MAIN_NAV, SHOP_NAV } from '../../config/site';
import { useAuthStore } from '../../store/auth';
import { Brand } from '../common/brand';
import { CurrencySwitcher } from './currency-switcher';

function shopLinkActive(to: string, pathname: string, search: string): boolean {
  if (to === '/shop') return pathname === '/shop' && !search.includes('category=');
  try {
    const url = new URL(to, 'http://local');
    if (pathname !== url.pathname) return false;
    const want = url.searchParams.get('category');
    const have = new URLSearchParams(search).get('category');
    return want === have;
  } catch {
    return false;
  }
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const accountLinks = user
    ? [
        ...ACCOUNT_NAV.map((link) => ({ ...link })),
        ...(user.role === 'admin' ? [{ label: 'Admin', to: '/admin' }] : []),
      ]
    : [
        { label: 'Sign in', to: '/login' },
        { label: 'Create account', to: '/register' },
      ];

  const topLinks = MAIN_NAV.filter((link) => link.to !== '/shop');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Brand />
        </SheetHeader>
        <div className="border-border flex items-center justify-between border-b px-4 py-3 sm:hidden">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Currency
          </span>
          <CurrencySwitcher />
        </div>
        <nav className="flex flex-col gap-1 p-3">
          <p className="text-muted-foreground px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide">
            Buy
          </p>
          {SHOP_NAV.map((link) => {
            const active = shopLinkActive(link.to, location.pathname, location.search);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-lg px-3 py-2.5 text-base font-medium transition-colors',
                  active ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-secondary',
                )}
              >
                {link.label}
              </NavLink>
            );
          })}

          <div className="border-border my-2 border-t" />

          {[...topLinks, ...accountLinks].map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/account'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-3 text-base font-medium transition-colors',
                  isActive ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-secondary',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          {user && (
            <button
              type="button"
              className="text-foreground hover:bg-secondary rounded-lg px-3 py-3 text-left text-base font-medium"
              onClick={() => {
                setOpen(false);
                logout();
                navigate('/');
              }}
            >
              Sign out
            </button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
