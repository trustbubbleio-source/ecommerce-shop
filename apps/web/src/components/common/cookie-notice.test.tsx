import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE_CONSENT_KEY, hasAnalyticsConsent } from '../../lib/cookie-consent';
import { CookieNotice } from './cookie-notice';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

function renderNotice() {
  return render(
    <MemoryRouter>
      <CookieNotice />
    </MemoryRouter>,
  );
}

describe('CookieNotice', () => {
  it('shows category choices when consent is pending', () => {
    renderNotice();
    expect(screen.getByRole('dialog', { name: /cookie preferences/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /necessary only/i })).toBeInTheDocument();
  });

  it('hides after Necessary only and does not grant analytics', async () => {
    const user = userEvent.setup();
    renderNotice();
    await user.click(screen.getByRole('button', { name: /necessary only/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(hasAnalyticsConsent()).toBe(false);
    expect(JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY)!).analytics).toBe(false);
  });

  it('grants analytics on Accept all', async () => {
    const user = userEvent.setup();
    renderNotice();
    await user.click(screen.getByRole('button', { name: /accept all/i }));
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it('saves custom analytics preference', async () => {
    const user = userEvent.setup();
    renderNotice();
    await user.click(screen.getByRole('button', { name: /customize/i }));
    await user.click(screen.getByRole('checkbox', { name: /analytics/i }));
    await user.click(screen.getByRole('button', { name: /save preferences/i }));
    expect(hasAnalyticsConsent()).toBe(true);
  });
});
