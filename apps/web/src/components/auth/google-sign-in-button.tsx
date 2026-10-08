import { useToast, buttonVariants, cn } from '@akknerds/ui';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@akknerds/api-client';
import { useGoogleAuth } from '../../hooks/use-auth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const GIS_SRC = 'https://accounts.google.com/gsi/client?hl=en';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src^="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google')));
      if (window.google?.accounts?.id) resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google'));
    document.head.appendChild(script);
  });
  return gisPromise;
}

/** True when Google Sign-In is configured for the storefront. */
export function isGoogleSignInEnabled(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'google_client_id_xxx');
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5 shrink-0" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.7 7.2l6.3 5.3C37.4 38.4 44 33 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

export function GoogleSignInButton({ redirectTo = '/account' }: { redirectTo?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gisRef = useRef<HTMLDivElement>(null);
  const googleAuth = useGoogleAuth();
  const { mutateAsync } = googleAuth;
  const navigate = useNavigate();
  const { toast } = useToast();
  const onCredential = useRef(mutateAsync);
  const onNavigate = useRef(navigate);
  const onToast = useRef(toast);
  onCredential.current = mutateAsync;
  onNavigate.current = navigate;
  onToast.current = toast;

  useEffect(() => {
    const host = hostRef.current;
    const gis = gisRef.current;
    if (!isGoogleSignInEnabled() || !host || !gis) return;
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    let lastWidth = 0;

    const paint = () => {
      if (cancelled || !window.google || !gisRef.current || !hostRef.current) return;
      const width = Math.max(240, Math.min(400, Math.floor(hostRef.current.clientWidth)));
      if (width === lastWidth && gisRef.current.querySelector('iframe')) return;
      lastWidth = width;
      gisRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(gisRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        locale: 'en',
        width,
      });
      requestAnimationFrame(() => {
        const box = hostRef.current;
        const button = gisRef.current?.querySelector<HTMLElement>('[role="button"]');
        if (!box || !button) return;
        button.style.setProperty('width', `${box.clientWidth}px`, 'important');
        button.style.setProperty('max-width', 'none', 'important');
        button.style.setProperty('height', `${box.clientHeight}px`, 'important');
      });
    };

    void loadGis()
      .then(() => {
        if (cancelled || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async (response) => {
            try {
              await onCredential.current(response.credential);
              onNavigate.current(redirectTo, { replace: true });
            } catch (error) {
              onToast.current({
                title: 'Google sign-in failed',
                description: error instanceof ApiError ? error.message : 'Please try again.',
                variant: 'error',
              });
            }
          },
        });
        paint();
        observer = new ResizeObserver(() => paint());
        observer.observe(host);
      })
      .catch(() => {
        // Visual button stays; the Google layer stays empty if the script fails.
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [redirectTo]);

  if (!isGoogleSignInEnabled()) return null;

  return (
    <div className="flex flex-col gap-3">
      <div ref={hostRef} className="relative h-12 w-full">
        <div
          className={cn(
            buttonVariants({ variant: 'outline', size: 'lg', block: true }),
            'pointer-events-none [&_svg]:size-5',
          )}
        >
          <GoogleMark />
          Continue with Google
        </div>
        <div ref={gisRef} className="absolute inset-0 z-10 overflow-hidden opacity-0" />
      </div>
      <div className="text-muted-foreground flex items-center gap-3 text-xs uppercase tracking-wide">
        <span className="bg-border h-px flex-1" />
        or
        <span className="bg-border h-px flex-1" />
      </div>
    </div>
  );
}
