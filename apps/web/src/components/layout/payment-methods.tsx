import { cn } from '@akknerds/ui';
import type { ReactNode } from 'react';

type BadgeProps = {
  label: string;
  className?: string;
  children: ReactNode;
};

function Badge({ label, className, children }: BadgeProps) {
  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        'border-border/70 bg-background/40 text-foreground inline-flex h-8 min-w-[2.75rem] items-center justify-center rounded-md border px-2',
        className,
      )}
    >
      {children}
    </span>
  );
}

function VisaMark() {
  return (
    <svg viewBox="0 0 48 16" className="h-3.5 w-auto" aria-hidden="true">
      <text
        x="0"
        y="12.5"
        fill="currentColor"
        fontFamily="Arial Black, Arial, sans-serif"
        fontSize="13"
        fontStyle="italic"
        fontWeight="800"
        letterSpacing="-0.5"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardMark() {
  return (
    <svg viewBox="0 0 36 22" className="h-4 w-auto" aria-hidden="true">
      <circle cx="13" cy="11" r="8" fill="#EB001B" />
      <circle cx="23" cy="11" r="8" fill="#F79E1B" />
      <path
        d="M18 5.2a8 8 0 0 1 0 11.6 8 8 0 0 1 0-11.6Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function KlarnaMark() {
  return (
    <span className="text-[11px] font-extrabold tracking-tight" aria-hidden="true">
      Klarna
    </span>
  );
}

function ApplePayMark() {
  return (
    <svg viewBox="0 0 52 20" className="h-3.5 w-auto" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9.2 4.4c-.5.6-.8 1.4-.7 2.2.8 0 1.7-.5 2.2-1.1.5-.6.8-1.4.7-2.2-.8.1-1.6.5-2.2 1.1Zm1.9 2.5c-1.2 0-2.2.7-2.8.7-.6 0-1.5-.7-2.5-.6-1.3 0-2.5.7-3.1 1.9-1.4 2.3-.3 5.8 1 7.7.6.9 1.4 2 2.4 1.9 1 0 1.3-.6 2.5-.6s1.5.6 2.5.6 1.7-1 2.3-1.9c.7-1 1-2 1-2.1 0 0-1.9-.7-1.9-2.9 0-1.8 1.5-2.7 1.5-2.7-.9-1.2-2.2-1.4-2.6-1.4-.1 0-.2 0-.3 0Z"
      />
      <text
        x="16"
        y="14.5"
        fill="currentColor"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="11"
        fontWeight="600"
      >
        Pay
      </text>
    </svg>
  );
}

const METHODS = [
  { id: 'visa', label: 'Visa', mark: <VisaMark /> },
  { id: 'mastercard', label: 'Mastercard', mark: <MastercardMark /> },
  { id: 'klarna', label: 'Klarna', mark: <KlarnaMark /> },
  { id: 'apple-pay', label: 'Apple Pay', mark: <ApplePayMark /> },
] as const;

/** Trust strip of accepted payment methods for the site footer. */
export function PaymentMethods({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 lg:items-end', className)}>
      <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.16em] lg:hidden">
        Secure payments
      </p>
      <ul
        className="flex list-none flex-wrap items-center justify-center gap-2 p-0 lg:justify-end"
        aria-label="Accepted payment methods"
      >
        {METHODS.map((method) => (
          <li key={method.id}>
            <Badge label={method.label}>{method.mark}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
