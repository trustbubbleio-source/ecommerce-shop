import { hasAnalyticsConsent } from './cookie-consent';

const SCRIPT_ID = 'omr-plausible';

/**
 * Load or unload privacy-friendly analytics (Plausible) based on consent.
 * Set `VITE_PLAUSIBLE_DOMAIN` (e.g. `www.onemorerip.cards`) to enable.
 * Without that env var, consent still works but no third-party script loads.
 */
export function syncAnalyticsFromConsent(): void {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim();
  if (!domain) {
    removeAnalyticsScript();
    return;
  }

  if (hasAnalyticsConsent()) {
    loadPlausible(domain);
  } else {
    removeAnalyticsScript();
  }
}

function loadPlausible(domain: string): void {
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.defer = true;
  script.dataset.domain = domain;
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}

function removeAnalyticsScript(): void {
  document.getElementById(SCRIPT_ID)?.remove();
}
