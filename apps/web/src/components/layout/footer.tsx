import { Link } from 'react-router-dom';
import footerLogo from '../../assets/rarity/onemorerip-logo-transparent-bg-white.png';
import { MAIN_NAV, SITE } from '../../config/site';

const SHOP_LINKS = MAIN_NAV.filter(
  (link) =>
    link.to !== '/shop' &&
    link.to !== '/sell' &&
    link.to !== '/blog' &&
    link.to !== '/contact' &&
    link.to !== '/socials',
);

const CUSTOMER_SERVICE_LINKS = [
  { label: 'Contact', to: '/contact' },
  { label: 'Shipping & Delivery', to: '/shipping' },
  { label: 'Returns & Refunds', to: '/returns' },
  { label: 'FAQ', to: '/faq' },
];

const LEGAL_LINKS = [
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Cookie Policy', to: '/cookies' },
];

const COMPANY_LINKS = [
  { label: 'Sell to us', to: '/sell' },
  { label: 'Socials', to: '/socials' },
  { label: 'Looking for partners', to: '/partners' },
  { label: 'Blog', to: '/blog' },
];

export function Footer() {
  return (
    <footer className="border-border bg-card/40 mt-16 border-t">
      <div className="container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
          <Link to="/" className="shrink-0 self-start" aria-label={`${SITE.name} home`}>
            <img src={footerLogo} alt={SITE.name} className="h-24 w-auto object-contain sm:h-28" />
          </Link>
          <p className="text-muted-foreground/70 text-xs leading-relaxed">{SITE.description}</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            <span className="text-foreground font-medium">{SITE.legalName}</span>
            <br />
            {SITE.store.line}
          </p>
        </div>

        <nav className="flex flex-col gap-2" aria-label="Shop">
          <h3 className="text-foreground text-sm font-semibold">Shop</h3>
          {SHOP_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <nav className="flex flex-col gap-2" aria-label="Customer service">
          <h3 className="text-foreground text-sm font-semibold">Customer service</h3>
          {CUSTOMER_SERVICE_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <nav className="flex flex-col gap-2" aria-label="Legal">
          <h3 className="text-foreground text-sm font-semibold">Legal</h3>
          {LEGAL_LINKS.map((link) => (
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
          <h3 className="text-foreground text-sm font-semibold">Company</h3>
          <nav className="flex flex-col gap-2" aria-label="Company">
            {COMPANY_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <a
            href={`mailto:${SITE.email.support}`}
            className="text-foreground mt-3 text-sm font-medium hover:underline"
          >
            {SITE.email.support}
          </a>
        </div>
      </div>

      <div className="border-border border-t">
        <div className="text-muted-foreground container flex flex-col items-center justify-between gap-3 py-6 text-xs sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link to="/shipping" className="hover:text-foreground hover:underline">
              Shipping
            </Link>
            <Link to="/returns" className="hover:text-foreground hover:underline">
              Returns
            </Link>
            <Link to="/terms" className="hover:text-foreground hover:underline">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-foreground hover:underline">
              Privacy
            </Link>
            <Link to="/cookies" className="hover:text-foreground hover:underline">
              Cookies
            </Link>
            <p>Pokémon and related marks are trademarks of their respective owners.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
