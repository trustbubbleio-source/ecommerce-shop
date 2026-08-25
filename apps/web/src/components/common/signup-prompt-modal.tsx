import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@akknerds/ui';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

const STORAGE_KEY = 'omr-signup-prompt';
const DELAY_MS = 15_000;

const SKIP_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/checkout',
  '/admin',
  '/sell',
] as const;

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* private mode */
  }
}

function shouldSkipPath(pathname: string): boolean {
  return SKIP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Soft signup nudge for guests after ~15s on the site.
 * Hidden when signed in, on auth/checkout routes, or after dismiss.
 * Does not reveal promo codes (welcome offer is assigned server-side on signup).
 */
export function SignupPromptModal() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user || wasDismissed() || shouldSkipPath(location.pathname)) {
      setOpen(false);
      return;
    }

    const id = window.setTimeout(() => {
      if (!useAuthStore.getState().user && !wasDismissed()) {
        setOpen(true);
      }
    }, DELAY_MS);

    return () => window.clearTimeout(id);
  }, [user, location.pathname]);

  const dismiss = () => {
    markDismissed();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>10% off your first order</DialogTitle>
          <DialogDescription>
            Create a free account and we&apos;ll unlock a welcome discount for your first purchase —
            members only.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-stretch">
          <Button asChild className="w-full sm:flex-1" onClick={dismiss}>
            <Link to="/register">Create free account</Link>
          </Button>
          <Button type="button" variant="ghost" className="w-full sm:flex-1" onClick={dismiss}>
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
