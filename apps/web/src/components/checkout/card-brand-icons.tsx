import type { ReactNode } from 'react';

/** Compact card-network marks for checkout trust signals (decorative). */
export function CardBrandIcons({ className }: { className?: string }) {
  return (
    <ul className={`flex items-center gap-2 ${className ?? ''}`} aria-label="Accepted cards">
      <li>
        <VisaMark />
        <span className="sr-only">Visa</span>
      </li>
      <li>
        <MastercardMark />
        <span className="sr-only">Mastercard</span>
      </li>
      <li>
        <AmexMark />
        <span className="sr-only">American Express</span>
      </li>
    </ul>
  );
}

function MarkShell({ children }: { children: ReactNode }) {
  return (
    <span className="border-border bg-background inline-flex h-8 items-center justify-center rounded-md border px-2 shadow-sm">
      {children}
    </span>
  );
}

function VisaMark() {
  return (
    <MarkShell>
      <svg width="36" height="12" viewBox="0 0 36 12" aria-hidden="true">
        <path
          fill="#1A1F71"
          d="M15.4 11.6 17.1.4h2.7L18 11.6h-2.6zm10.2-11c-.5-.2-1.4-.4-2.4-.4-2.7 0-4.6 1.4-4.6 3.5 0 1.5 1.4 2.4 2.5 2.9 1.1.5 1.5.9 1.5 1.4 0 .7-.9 1.1-1.7 1.1-1.1 0-1.7-.2-2.7-.6l-.4-.2-.4 2.4c.7.3 2 .6 3.4.6 2.8 0 4.7-1.4 4.7-3.6 0-1.2-.7-2.1-2.3-2.9-1-.5-1.5-.9-1.5-1.4 0-.5.5-1 1.7-1 1 0 1.7.2 2.2.4l.3.1.4-2.3zM32.7.4h-2.1c-.6 0-1.1.2-1.4.8L25 11.6h2.8l.5-1.5h3.4l.3 1.5H35L32.7.4zm-2.9 7.3.9-3.4.6 3.4h-1.5zM13.2.4 10.6 8 10.3 6.6c-.5-1.7-2.1-3.6-3.9-4.5l2.4 9.5h2.8L15.9.4h-2.7zM7.2.4H2.9L2.8.6C2 1 .9 1.3 0 1.5l.1.4h1.7C2.5 2 3 2.5 3.2 3.3l1.8 8.3h2.8L11 .4H7.2z"
        />
      </svg>
    </MarkShell>
  );
}

function MastercardMark() {
  return (
    <MarkShell>
      <svg width="28" height="18" viewBox="0 0 28 18" aria-hidden="true">
        <circle cx="10" cy="9" r="7" fill="#EB001B" />
        <circle cx="18" cy="9" r="7" fill="#F79E1B" />
        <path
          fill="#FF5F00"
          d="M14 3.6a7 7 0 0 1 0 10.8 7 7 0 0 1 0-10.8z"
        />
      </svg>
    </MarkShell>
  );
}

function AmexMark() {
  return (
    <MarkShell>
      <svg width="28" height="18" viewBox="0 0 28 18" aria-hidden="true">
        <rect width="28" height="18" rx="2" fill="#2E77BC" />
        <text
          x="14"
          y="12"
          textAnchor="middle"
          fill="#fff"
          fontSize="7"
          fontFamily="system-ui,sans-serif"
          fontWeight="700"
        >
          AMEX
        </text>
      </svg>
    </MarkShell>
  );
}
