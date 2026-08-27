import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  cn,
} from '@akknerds/ui';
import { ChevronDown, Menu } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MAIN_NAV, SHOP_NAV } from '../../config/site';
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
  const [buyOpen, setBuyOpen] = useState(false);
  const location = useLocation();

  const topLinks = MAIN_NAV.filter((link) => link.to !== '/shop');
  const buyActive = SHOP_NAV.some((link) =>
    shopLinkActive(link.to, location.pathname, location.search),
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setBuyOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col gap-0 overflow-hidden p-0">
        <SheetHeader className="shrink-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Brand />
        </SheetHeader>
        <div className="border-border flex h-16 shrink-0 items-center justify-between border-b px-4 sm:hidden">
          <span className="text-muted-foreground text-xs font-medium uppercase leading-none tracking-wide">
            Currency
          </span>
          <CurrencySwitcher />
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain p-3">
          <button
            type="button"
            aria-expanded={buyOpen}
            aria-controls="mobile-buy-nav"
            onClick={() => setBuyOpen((value) => !value)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-base font-medium transition-colors',
              buyActive || buyOpen
                ? 'bg-primary/15 text-primary'
                : 'text-foreground hover:bg-secondary',
            )}
          >
            Buy
            <ChevronDown
              className={cn(
                'size-4 shrink-0 opacity-70 transition-transform',
                buyOpen && 'rotate-180',
              )}
              aria-hidden
            />
          </button>
          {buyOpen && (
            <div id="mobile-buy-nav" className="flex flex-col gap-1 pb-1 pl-2">
              {SHOP_NAV.map((link) => {
                const active = shopLinkActive(link.to, location.pathname, location.search);
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                    )}
                  >
                    {link.label}
                  </NavLink>
                );
              })}
            </div>
          )}

          <div className="border-border my-2 border-t" />

          {topLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
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
        </nav>
      </SheetContent>
    </Sheet>
  );
}
