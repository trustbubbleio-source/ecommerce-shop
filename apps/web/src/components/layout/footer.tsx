import { Link } from 'react-router-dom';
import footerLogo from '../../assets/rarity/logo2.png';
import { MAIN_NAV, SITE } from '../../config/site';

const SUPPORT_LINKS = [
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/contact' },
  { label: 'Shop all', to: '/shop' },
  { label: 'Sign in', to: '/login' },
];

export function Footer() {
  return (
    <footer className="border-border bg-card/40 mt-16 border-t">
      <div className="container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <Link to="/" className="shrink-0" aria-label={`${SITE.name} home`}>
            <img src={footerLogo} alt={SITE.name} className="h-28 w-auto object-contain sm:h-32" />
          </Link>
          <p className="text-muted-foreground min-w-0 text-sm leading-relaxed">
            {SITE.description}
          </p>
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
          <h3 className="text-foreground text-sm font-semibold">Visit & contact</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{SITE.store.line}</p>
          <a
            href={`mailto:${SITE.emailContact}`}
            className="text-primary text-sm font-medium hover:underline"
          >
            {SITE.emailContact}
          </a>
          <a
            href={`mailto:${SITE.email}`}
            className="text-muted-foreground hover:text-foreground text-sm"
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
          <p>Pokémon and all related characters are trademarks of Nintendo.</p>
        </div>
      </div>
    </footer>
  );
}
