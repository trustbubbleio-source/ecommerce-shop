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
import { NavLink } from 'react-router-dom';
import { MAIN_NAV } from '../../config/site';
import { useAuthStore } from '../../store/auth';
import { Brand } from '../common/brand';
import { CurrencySwitcher } from './currency-switcher';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  const accountLinks = user
    ? [{ label: 'My account', to: '/account' }]
    : [
        { label: 'Sign in', to: '/login' },
        { label: 'Create account', to: '/register' },
      ];

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
          {[...MAIN_NAV, ...accountLinks].map((link) => (
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
