/** Persisted cookie preference categories (EU/Swedish ePrivacy). */

export const COOKIE_CONSENT_KEY = 'omr-cookie-consent';
/** Legacy acknowledge-only key from the previous banner. */
export const COOKIE_NOTICE_KEY = 'omr-cookie-notice';
export const COOKIE_CONSENT_EVENT = 'omr-cookie-consent-changed';
export const COOKIE_PREFERENCES_EVENT = 'omr-cookie-preferences';
/** @deprecated Alias kept for signup-prompt compatibility. */
export const COOKIE_ACK_EVENT = COOKIE_CONSENT_EVENT;

export interface CookieConsent {
  version: 1;
  /** Always true — required for the shop to function. */
  necessary: true;
  /** Optional analytics / statistics (e.g. Plausible). */
  analytics: boolean;
  decidedAt: string;
}

const CURRENT_VERSION = 1 as const;

export function isCookieConsentPending(): boolean {
  return getCookieConsent() === null;
}

/** True until the visitor has made a consent choice (accept / reject / custom). */
export function isCookieNoticePending(): boolean {
  return isCookieConsentPending();
}

export function getCookieConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CookieConsent>;
      if (parsed?.version === CURRENT_VERSION && typeof parsed.analytics === 'boolean') {
        return {
          version: CURRENT_VERSION,
          necessary: true,
          analytics: parsed.analytics,
          decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : new Date().toISOString(),
        };
      }
    }

    // Migrate legacy "Got it" ack → necessary only, no analytics.
    if (localStorage.getItem(COOKIE_NOTICE_KEY) === 'acknowledged') {
      const migrated = saveCookieConsent({ analytics: false });
      try {
        localStorage.removeItem(COOKIE_NOTICE_KEY);
      } catch {
        /* ignore */
      }
      return migrated;
    }
  } catch {
    /* private mode / invalid JSON */
  }
  return null;
}

export function saveCookieConsent(input: { analytics: boolean }): CookieConsent {
  const consent: CookieConsent = {
    version: CURRENT_VERSION,
    necessary: true,
    analytics: input.analytics,
    decidedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    localStorage.removeItem(COOKIE_NOTICE_KEY);
  } catch {
    /* ignore private mode */
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: consent }));
  return consent;
}

export function openCookiePreferences(): void {
  window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT));
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent()?.analytics === true;
}
