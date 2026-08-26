import { cn } from '@akknerds/ui';
import { NavLink } from 'react-router-dom';
import { MAIN_NAV } from '../../config/site';
import { Brand } from '../common/brand';
import { CartDrawer } from './cart-drawer';
import { CurrencySwitcher } from './currency-switcher';
import { MobileNav } from './mobile-nav';
import { SearchDialog } from './search-dialog';
import { ShopNavDropdown } from './shop-nav-dropdown';
import { UserMenu } from './user-menu';

export function Header() {
  return (
    <header className="border-border/80 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-lg">
      <div className="container flex h-16 items-center gap-2">
        <MobileNav />
        <Brand className="mr-2" />

        <nav className="hidden items-center gap-1 md:flex">
          {MAIN_NAV.map((link) =>
            link.to === '/shop' ? (
              <ShopNavDropdown key={link.to} />
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {link.label}
              </NavLink>
            ),
          )}
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
