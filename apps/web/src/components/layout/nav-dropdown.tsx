import { cn } from '@akknerds/ui';
import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { NavLink } from '../../config/site';

function defaultItemActive(to: string, pathname: string): boolean {
  if (to === pathname) return true;
  return pathname.startsWith(`${to}/`);
}

interface NavDropdownProps {
  label: string;
  items: NavLink[];
  /** Whether the top-level menu should look active for the current route. */
  isMenuActive: (pathname: string, search: string) => boolean;
  /** Optional per-item active matcher (defaults to path / nested path). */
  isItemActive?: (to: string, pathname: string, search: string) => boolean;
}

/** Desktop header dropdown menu (Buy, Services, Socials, …). */
export function NavDropdown({ label, items, isMenuActive, isItemActive }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const location = useLocation();
  const menuActive = isMenuActive(location.pathname, location.search);
  const matchItem = isItemActive ?? ((to, pathname) => defaultItemActive(to, pathname));

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
          menuActive || open ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <ChevronDown className={cn('size-3.5 opacity-70 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="border-border bg-popover text-popover-foreground absolute left-0 top-full z-50 min-w-44 overflow-hidden rounded-xl border py-1 shadow-lg"
        >
          {items.map((link) => {
            const active = matchItem(link.to, location.pathname, location.search);
            return (
              <Link
                key={link.to}
                role="menuitem"
                to={link.to}
                onClick={() => setOpen(false)}
                className={cn(
                  'block px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary',
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
