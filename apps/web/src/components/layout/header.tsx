import { Button, cn } from '@akknerds/ui';
import { Search } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { MAIN_NAV } from '../../config/site';
import { Brand } from '../common/brand';
import { CartDrawer } from './cart-drawer';
import { MobileNav } from './mobile-nav';
import { UserMenu } from './user-menu';

export function Header() {
  return (
    <header className="border-border/80 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-lg">
      <div className="container flex h-16 items-center gap-2">
        <MobileNav />
        <Brand className="mr-2" />

        <nav className="hidden items-center gap-1 md:flex">
          {MAIN_NAV.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/shop'}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-0.5">
          <Button asChild variant="ghost" size="icon" aria-label="Search">
            <Link to="/shop">
              <Search />
            </Link>
          </Button>
          <UserMenu />
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
