import { Button, cn } from '@akknerds/ui';
import { ChevronDown, ClipboardList, Heart, LogIn, LogOut, Package, Settings, Shield, User } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ACCOUNT_NAV } from '../../config/account';
import { useAuthStore } from '../../store/auth';

const NAV_ICONS = {
  '/account': User,
  '/account/orders': Package,
  '/account/favorites': Heart,
  '/account/want-list': ClipboardList,
  '/account/settings': Settings,
} as const;

const DROPDOWN_NAV = ACCOUNT_NAV.filter((link) => link.to !== '/account/discount');

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

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

  if (!user) {
    return (
      <Button asChild variant="ghost" size="icon" aria-label="Sign in">
        <Link to="/login">
          <LogIn />
        </Link>
      </Button>
    );
  }

  const firstName = user.name.split(' ')[0];

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <User className="size-4" />
        <span className="hidden max-w-24 truncate sm:inline">{firstName}</span>
        <ChevronDown className={cn('size-3.5 opacity-70 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="border-border bg-popover text-popover-foreground absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border shadow-lg"
        >
          <div className="border-border border-b px-3 py-2.5">
            <p className="text-foreground truncate text-sm font-semibold">{user.name}</p>
            <p className="text-muted-foreground truncate text-xs">{user.email}</p>
          </div>
          <div className="flex flex-col p-1">
            {DROPDOWN_NAV.map((link) => {
              const Icon = NAV_ICONS[link.to as keyof typeof NAV_ICONS];
              return (
                <Link
                  key={link.to}
                  role="menuitem"
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="text-foreground hover:bg-secondary flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
                >
                  {Icon ? <Icon className="text-muted-foreground size-4" /> : null}
                  {link.label}
                </Link>
              );
            })}
            {user.role === 'admin' && (
              <Link
                role="menuitem"
                to="/admin"
                onClick={() => setOpen(false)}
                className="text-foreground hover:bg-secondary flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
              >
                <Shield className="text-muted-foreground size-4" />
                Admin
              </Link>
            )}
          </div>
          <div className="border-border border-t p-1">
            <button
              type="button"
              role="menuitem"
              className="text-foreground hover:bg-secondary flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium"
              onClick={() => {
                setOpen(false);
                logout();
                navigate('/');
              }}
            >
              <LogOut className="text-muted-foreground size-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
