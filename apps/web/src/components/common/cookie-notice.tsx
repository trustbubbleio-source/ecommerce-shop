import { Button } from '@akknerds/ui';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { syncAnalyticsFromConsent } from '../../lib/analytics';
import {
  COOKIE_CONSENT_EVENT,
  COOKIE_NOTICE_KEY,
  COOKIE_PREFERENCES_EVENT,
  getCookieConsent,
  isCookieConsentPending,
  isCookieNoticePending,
  openCookiePreferences,
  saveCookieConsent,
  type CookieConsent,
} from '../../lib/cookie-consent';

export {
  COOKIE_CONSENT_EVENT as COOKIE_ACK_EVENT,
  COOKIE_NOTICE_KEY,
  isCookieNoticePending,
  openCookiePreferences,
};

/**
 * Category consent banner (necessary + optional analytics).
 * Analytics scripts load only after an explicit analytics opt-in.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    syncAnalyticsFromConsent();
    setVisible(isCookieConsentPending());

    const onPreferences = () => {
      const current = getCookieConsent();
      setAnalytics(current?.analytics ?? false);
      setCustomize(true);
      setVisible(true);
    };
    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsent>).detail;
      if (detail) syncAnalyticsFromConsent();
    };
    window.addEventListener(COOKIE_PREFERENCES_EVENT, onPreferences);
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
    return () => {
      window.removeEventListener(COOKIE_PREFERENCES_EVENT, onPreferences);
      window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
    };
  }, []);

  const decide = (nextAnalytics: boolean) => {
    saveCookieConsent({ analytics: nextAnalytics });
    syncAnalyticsFromConsent();
    setVisible(false);
    setCustomize(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="border-border bg-card/95 fixed inset-x-0 bottom-0 z-50 border-t p-4 shadow-lg backdrop-blur-md sm:p-5"
    >
      <div className="container flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="max-w-3xl">
            <p className="text-foreground text-sm font-semibold">Cookies &amp; privacy</p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              We use strictly necessary cookies and local storage so the shop works (cart, sign-in,
              checkout). Optional analytics help us improve the site — only if you allow them. See
              our{' '}
              <Link
                to="/cookies"
                className="text-foreground font-medium underline-offset-2 hover:underline"
              >
                Cookie Policy
              </Link>{' '}
              and{' '}
              <Link
                to="/privacy"
                className="text-foreground font-medium underline-offset-2 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
          {!customize ? (
            <div className="flex shrink-0 flex-wrap gap-2 self-end sm:self-start">
              <Button type="button" size="sm" variant="outline" onClick={() => decide(false)}>
                Necessary only
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setCustomize(true)}>
                Customize
              </Button>
              <Button type="button" size="sm" onClick={() => decide(true)}>
                Accept all
              </Button>
            </div>
          ) : null}
        </div>

        {customize ? (
          <div className="border-border bg-background/60 flex flex-col gap-3 rounded-lg border p-3 sm:p-4">
            <label className="flex cursor-not-allowed items-start gap-3 text-sm opacity-80">
              <input type="checkbox" className="mt-0.5 size-4 shrink-0" checked disabled readOnly />
              <span>
                <span className="text-foreground font-medium">Necessary</span>
                <span className="text-muted-foreground block text-xs leading-relaxed">
                  Always on — cart, sign-in, checkout, security.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="border-input text-primary mt-0.5 size-4 shrink-0 rounded accent-primary"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              <span>
                <span className="text-foreground font-medium">Analytics</span>
                <span className="text-muted-foreground block text-xs leading-relaxed">
                  Anonymous traffic statistics (e.g. Plausible) to understand which pages help
                  collectors. No ads, no sale of data.
                </span>
              </span>
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" size="sm" variant="outline" onClick={() => setCustomize(false)}>
                Back
              </Button>
              <Button type="button" size="sm" onClick={() => decide(analytics)}>
                Save preferences
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
