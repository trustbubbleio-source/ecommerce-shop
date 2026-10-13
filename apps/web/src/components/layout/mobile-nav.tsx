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
import { MAIN_NAV, type NavLink as SiteNavLink } from '../../config/site';
import { Brand } from '../common/brand';
import { CurrencySwitcher } from './currency-switcher';
import { shopLinkActive } from './shop-nav-dropdown';

function pathItemActive(to: string, pathname: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`);
}

function menuActive(
  id: string,
  items: SiteNavLink[],
  pathname: string,
  search: string,
): boolean {
  if (id === 'buy') {
    return items.some((link) => shopLinkActive(link.to, pathname, search));
  }
  return items.some((link) => pathItemActive(link.to, pathname));
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const location = useLocation();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setOpenMenus({});
  };

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
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
          {MAIN_NAV.map((entry, index) => {
            const divider = index === 1 ? <div className="border-border my-2 border-t" /> : null;

            if (entry.kind === 'link') {
              return (
                <div key={entry.to}>
                  {divider}
                  <NavLink
                    to={entry.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'rounded-lg px-3 py-3 text-base font-medium transition-colors',
                        isActive
                          ? 'bg-primary/15 text-primary'
                          : 'text-foreground hover:bg-secondary',
                      )
                    }
                  >
                    {entry.label}
                  </NavLink>
                </div>
              );
            }

            const expanded = Boolean(openMenus[entry.id]);
            const active = menuActive(entry.id, entry.items, location.pathname, location.search);
            const panelId = `mobile-${entry.id}-nav`;

            return (
              <div key={entry.id} className="flex flex-col gap-1">
                {divider}
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggleMenu(entry.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-base font-medium transition-colors',
                    active || expanded
                      ? 'bg-primary/15 text-primary'
                      : 'text-foreground hover:bg-secondary',
                  )}
                >
                  {entry.label}
                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 opacity-70 transition-transform',
                      expanded && 'rotate-180',
                    )}
                    aria-hidden
                  />
                </button>
                {expanded && (
                  <div id={panelId} className="flex flex-col gap-1 pb-1 pl-2">
                    {entry.items.map((link) => {
                      const itemActive =
                        entry.id === 'buy'
                          ? shopLinkActive(link.to, location.pathname, location.search)
                          : pathItemActive(link.to, location.pathname);
                      return (
                        <NavLink
                          key={link.to}
                          to={link.to}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            itemActive
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
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
