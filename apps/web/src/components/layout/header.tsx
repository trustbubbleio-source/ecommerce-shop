import { cn } from '@akknerds/ui';
import { NavLink } from 'react-router-dom';
import { MAIN_NAV } from '../../config/site';
import { Brand } from '../common/brand';
import { CartDrawer } from './cart-drawer';
import { CurrencySwitcher } from './currency-switcher';
import { MobileNav } from './mobile-nav';
import { NavDropdown } from './nav-dropdown';
import { SearchDialog } from './search-dialog';
import { UserMenu } from './user-menu';

function menuPathActive(items: { to: string }[], pathname: string): boolean {
  return items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
}

function navLinkClass(isActive: boolean): string {
  return cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
  );
}

export function Header() {
  return (
    <header className="border-border/80 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-lg">
      <div className="container flex h-16 items-center gap-2">
        <MobileNav />
        <Brand className="mr-2" />

        <nav className="hidden items-center gap-1 md:flex">
          {MAIN_NAV.map((entry) => {
            if (entry.kind === 'link') {
              return (
                <NavLink
                  key={entry.to}
                  to={entry.to}
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  {entry.label}
                </NavLink>
              );
            }

            // Desktop: Buy goes straight to /shop — categories live in the shop sidebar.
            // Mobile keeps the Buy accordion with category shortcuts.
            if (entry.id === 'buy') {
              return (
                <NavLink
                  key={entry.id}
                  to="/shop"
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  {entry.label}
                </NavLink>
              );
            }

            return (
              <NavDropdown
                key={entry.id}
                label={entry.label}
                items={entry.items}
                isMenuActive={(pathname) => menuPathActive(entry.items, pathname)}
              />
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <CurrencySwitcher className="hidden sm:inline-flex" />
          <SearchDialog />
          <UserMenu />
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
