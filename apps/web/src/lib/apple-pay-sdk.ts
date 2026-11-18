const APPLE_PAY_SDK_SRC = 'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';

let applePayPromise: Promise<void> | null = null;

function applePaySdkReady(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ApplePaySession);
}

/** Load Apple's apple-pay-sdk.js once. Required for `<apple-pay-button>` + session APIs. */
export function loadApplePaySdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (applePaySdkReady()) return Promise.resolve();
  if (applePayPromise) return applePayPromise;

  applePayPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${APPLE_PAY_SDK_SRC}"]`,
    );
    if (existing) {
      if (applePaySdkReady()) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Apple Pay SDK')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = APPLE_PAY_SDK_SRC;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Apple Pay SDK'));
    document.head.appendChild(script);
  }).then(
    () => undefined,
    (error: unknown) => {
      applePayPromise = null;
      throw error;
    },
  );

  return applePayPromise;
}

export function isApplePaySdkReady(): boolean {
  return applePaySdkReady();
}

export function canMakeApplePayPayments(): boolean {
  try {
    return Boolean(window.ApplePaySession?.canMakePayments?.());
  } catch {
    return false;
  }
}
