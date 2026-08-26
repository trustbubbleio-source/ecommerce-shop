import { cn } from '@akknerds/ui';
import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SHOP_NAV } from '../../config/site';

function isShopPath(pathname: string): boolean {
  return pathname === '/shop';
}

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

/** Desktop Buy nav item with category dropdown. */
export function ShopNavDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const location = useLocation();
  const shopActive = isShopPath(location.pathname);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          shopActive || open ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        Buy
        <ChevronDown className={cn('size-3.5 opacity-70 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Buy"
          className="border-border bg-popover text-popover-foreground absolute left-0 top-full z-50 min-w-44 overflow-hidden rounded-xl border py-1 shadow-lg"
        >
          {SHOP_NAV.map((link) => {
            const active = shopLinkActive(link.to, location.pathname, location.search);
            return (
              <Link
                key={link.to}
                role="menuitem"
                to={link.to}
                onClick={() => setOpen(false)}
                className={cn(
                  'block px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-secondary',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
