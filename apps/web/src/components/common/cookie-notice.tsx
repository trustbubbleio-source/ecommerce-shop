import { Button } from '@akknerds/ui';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'omr-cookie-notice';

/**
 * EU/Swedish ePrivacy-style notice for a shop that currently uses
 * strictly necessary cookies/localStorage only (cart, auth, checkout).
 * Non-essential analytics are not loaded until separately consented.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'acknowledged');
    } catch {
      /* ignore private mode */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-50 border-t p-4 shadow-lg backdrop-blur-md sm:p-5"
    >
      <div className="container flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
          We use strictly necessary cookies and local storage so the shop works (cart, sign-in,
          checkout). See our{' '}
          <Link to="/cookies" className="text-foreground font-medium underline-offset-2 hover:underline">
            Cookie Policy
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-foreground font-medium underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          . We do not load non-essential analytics without consent.
        </p>
        <Button type="button" size="sm" className="shrink-0 self-end sm:self-auto" onClick={dismiss}>
          Got it
        </Button>
      </div>
    </div>
  );
}
