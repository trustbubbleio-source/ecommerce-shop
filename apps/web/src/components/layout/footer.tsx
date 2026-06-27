import { Link } from 'react-router-dom';
import { MAIN_NAV, SITE } from '../../config/site';
import { Brand } from '../common/brand';

const SUPPORT_LINKS = [
  { label: 'Contact', to: '/contact' },
  { label: 'Shop all', to: '/shop' },
  { label: 'Sign in', to: '/login' },
];

export function Footer() {
  return (
    <footer className="border-border bg-card/40 mt-16 border-t">
      <div className="container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Brand />
          <p className="text-muted-foreground max-w-xs text-sm">{SITE.description}</p>
        </div>

        <nav className="flex flex-col gap-2" aria-label="Shop">
          <h3 className="text-foreground text-sm font-semibold">Shop</h3>
          {MAIN_NAV.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <nav className="flex flex-col gap-2" aria-label="Support">
          <h3 className="text-foreground text-sm font-semibold">Support</h3>
          {SUPPORT_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2">
          <h3 className="text-foreground text-sm font-semibold">Stay in the loop</h3>
          <p className="text-muted-foreground text-sm">
            New drops, restocks and exclusive bundles — first.
          </p>
          <a
            href={`mailto:${SITE.email}`}
            className="text-primary text-sm font-medium hover:underline"
          >
            {SITE.email}
          </a>
        </div>
      </div>

      <div className="border-border border-t">
        <div className="text-muted-foreground container flex flex-col items-center justify-between gap-2 py-6 text-xs sm:flex-row">
          <p>
            © {2024} {SITE.name}. All rights reserved.
          </p>
          <p>
            Pokémon and all related characters are trademarks of Nintendo. This is a demo store.
          </p>
        </div>
      </div>
    </footer>
  );
}
