import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  COOKIE_CONSENT_KEY,
  COOKIE_NOTICE_KEY,
  getCookieConsent,
  hasAnalyticsConsent,
  isCookieConsentPending,
  saveCookieConsent,
} from './cookie-consent';

describe('cookie consent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('is pending until a choice is saved', () => {
    expect(isCookieConsentPending()).toBe(true);
    expect(getCookieConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('stores analytics opt-in', () => {
    const consent = saveCookieConsent({ analytics: true });
    expect(consent.necessary).toBe(true);
    expect(consent.analytics).toBe(true);
    expect(isCookieConsentPending()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(true);
    expect(JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY)!).analytics).toBe(true);
  });

  it('stores analytics opt-out', () => {
    saveCookieConsent({ analytics: false });
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('migrates legacy acknowledge-only notice to necessary-only', () => {
    localStorage.setItem(COOKIE_NOTICE_KEY, 'acknowledged');
    const consent = getCookieConsent();
    expect(consent?.analytics).toBe(false);
    expect(localStorage.getItem(COOKIE_NOTICE_KEY)).toBeNull();
    expect(isCookieConsentPending()).toBe(false);
  });
});
