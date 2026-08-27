import { registerInputSchema } from '@akknerds/shared';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  cn,
} from '@akknerds/ui';
import { type FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import bulkCards from '../../assets/rarity/bulkcards.jpg';
import logo from '../../assets/rarity/onemorerip-logo-transparent-bg-white.png';
import star from '../../assets/rarity/1.png';
import { SITE } from '../../config/site';
import { useAuthStore } from '../../store/auth';

const STORAGE_KEY = 'omr-signup-prompt';
const DELAY_MS = 15_000;

const SKIP_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/checkout',
  '/admin',
  '/sell',
] as const;

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* private mode */
  }
}

function shouldSkipPath(pathname: string): boolean {
  return SKIP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Soft signup nudge for guests after ~15s on the site.
 * Hidden when signed in, on auth/checkout routes, or after dismiss.
 * Does not reveal promo codes (welcome offer is assigned server-side on signup).
 */
export function SignupPromptModal() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (user || wasDismissed() || shouldSkipPath(location.pathname)) {
      setOpen(false);
      return;
    }

    const id = window.setTimeout(() => {
      if (!useAuthStore.getState().user && !wasDismissed()) {
        setOpen(true);
      }
    }, DELAY_MS);

    return () => window.clearTimeout(id);
  }, [user, location.pathname]);

  const dismiss = () => {
    markDismissed();
    setOpen(false);
    setError(undefined);
  };

  const claim = (event: FormEvent) => {
    event.preventDefault();
    const parsed = registerInputSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a valid email');
      return;
    }
    setError(undefined);
    dismiss();
    navigate('/register', { state: { email: parsed.data.email } });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <DialogContent
        hideClose
        className={cn(
          'max-w-[22rem] gap-0 overflow-hidden border-0 p-0 text-white shadow-2xl sm:max-w-sm',
          'bg-[#0b2f63] rounded-2xl',
        )}
      >
        <div className="relative overflow-hidden px-6 pb-7 pt-5">
          {/* Atmosphere */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <img
              src={bulkCards}
              alt=""
              className="absolute -right-8 -top-10 h-44 w-44 rotate-12 object-cover opacity-25 blur-[1px]"
            />
            <img
              src={bulkCards}
              alt=""
              className="absolute -bottom-16 -left-10 h-48 w-48 -rotate-12 object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0b2f63]/40 via-[#0b2f63]/85 to-[#071f42]" />
            <img
              src={star}
              alt=""
              className="absolute left-3 top-16 size-7 opacity-40"
            />
            <img
              src={star}
              alt=""
              className="absolute right-5 top-24 size-5 rotate-12 opacity-30"
            />
            <img
              src={star}
              alt=""
              className="absolute bottom-20 right-8 size-6 -rotate-6 opacity-25"
            />
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full text-[#f5d76e] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5d76e]/70"
            aria-label="Close"
          >
            <span className="text-xl font-bold leading-none" aria-hidden>
              ×
            </span>
          </button>

          <div className="relative z-10 flex flex-col items-center text-center">
            <img
              src={logo}
              alt={SITE.name}
              className="mb-5 h-12 w-auto object-contain drop-shadow-md"
            />

            <DialogTitle className="text-[2rem] font-extrabold leading-none tracking-tight text-white sm:text-[2.15rem]">
              Receive 10% off
            </DialogTitle>
            <DialogDescription className="mt-3 max-w-[17rem] text-sm leading-relaxed text-white/80">
              Sign up and get 10% off your first order — welcome gift for new members.
            </DialogDescription>

            <form onSubmit={claim} className="mt-6 flex w-full flex-col gap-3" noValidate>
              <label className="sr-only" htmlFor="signup-prompt-email">
                Email address
              </label>
              <Input
                id="signup-prompt-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(undefined);
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'signup-prompt-email-error' : undefined}
                className={cn(
                  'h-12 rounded-full border-0 bg-white px-5 text-sm font-medium text-neutral-900 shadow-md',
                  'placeholder:text-neutral-500 focus-visible:ring-[#f5d76e]/80',
                )}
              />
              {error ? (
                <p id="signup-prompt-email-error" className="text-left text-xs text-amber-200" role="alert">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                className="h-12 w-full rounded-full border-0 bg-[#f5d76e] text-base font-extrabold text-neutral-950 shadow-md hover:bg-[#ffe08a] hover:text-neutral-950"
              >
                Claim 10% off
              </Button>
            </form>

            <button
              type="button"
              onClick={dismiss}
              className="mt-4 text-xs font-medium text-white/55 underline-offset-2 transition hover:text-white/85 hover:underline"
            >
              Not now
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
