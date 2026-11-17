const PAY_JS_SRC = 'https://pay.google.com/gp/p/js/pay.js';

let payJsPromise: Promise<void> | null = null;

function googlePaymentsReady(): boolean {
  return Boolean(
    (window as Window & { google?: { payments?: { api?: { PaymentsClient?: unknown } } } }).google
      ?.payments?.api?.PaymentsClient,
  );
}

/** Load Google Pay's pay.js once. Required before GooglePayOneTimePaymentButton mounts. */
export function loadGooglePaySdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (googlePaymentsReady()) return Promise.resolve();
  if (payJsPromise) return payJsPromise;

  payJsPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PAY_JS_SRC}"]`,
    );
    if (existing) {
      if (googlePaymentsReady()) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Google Pay SDK')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = PAY_JS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Pay SDK'));
    document.head.appendChild(script);
  }).then(
    () => undefined,
    (error: unknown) => {
      payJsPromise = null;
      throw error;
    },
  );

  return payJsPromise;
}

export function isGooglePaySdkReady(): boolean {
  return typeof window !== 'undefined' && googlePaymentsReady();
}
