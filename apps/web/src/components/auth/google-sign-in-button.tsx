import { useToast } from '@akknerds/ui';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../lib/api';
import { useGoogleAuth } from '../../hooks/use-auth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const GIS_SRC = 'https://accounts.google.com/gsi/client';

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
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google')));
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

export function GoogleSignInButton({ redirectTo = '/account' }: { redirectTo?: string }) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const googleAuth = useGoogleAuth();
  const { mutateAsync } = googleAuth;
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isGoogleSignInEnabled() || !buttonRef.current) return;
    let cancelled = false;

    void loadGis()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              await mutateAsync(response.credential);
              navigate(redirectTo, { replace: true });
            } catch (error) {
              toast({
                title: 'Google sign-in failed',
                description: error instanceof ApiError ? error.message : 'Please try again.',
                variant: 'error',
              });
            }
          },
        });
        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 320,
        });
      })
      .catch(() => {
        // Button stays empty if GIS fails to load.
      });

    return () => {
      cancelled = true;
    };
  }, [mutateAsync, navigate, redirectTo, toast]);

  if (!isGoogleSignInEnabled()) return null;

  return (
    <div className="flex flex-col gap-3">
      <div ref={buttonRef} className="flex justify-center" />
      <div className="text-muted-foreground flex items-center gap-3 text-xs uppercase tracking-wide">
        <span className="bg-border h-px flex-1" />
        or
        <span className="bg-border h-px flex-1" />
      </div>
    </div>
  );
}
