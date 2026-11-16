import type { ReactNode } from 'react';

/** Compact card-network marks for checkout trust signals (decorative). */
export function CardBrandIcons({ className }: { className?: string }) {
  return (
    <ul
      className={`pointer-events-none flex items-center gap-1 ${className ?? ''}`}
      aria-hidden="true"
    >
      <li>
        <VisaMark />
      </li>
      <li>
        <MastercardMark />
      </li>
      <li>
        <MaestroMark />
      </li>
      <li>
        <AmexMark />
      </li>
    </ul>
  );
}

function MarkShell({ children }: { children: ReactNode }) {
  return (
    <span className="bg-white inline-flex h-[18px] w-[28px] items-center justify-center rounded-[3px] shadow-sm">
      {children}
    </span>
  );
}

/** Badge-style Visa wordmark — matches the other network tiles better than a sparse path. */
function VisaMark() {
  return (
    <MarkShell>
      <svg width="24" height="10" viewBox="0 0 48 16" aria-hidden="true">
        <rect width="48" height="16" rx="2" fill="#1A1F71" />
        <text
          x="24"
          y="11.5"
          textAnchor="middle"
          fill="#fff"
          fontSize="9"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="700"
          letterSpacing="0.5"
        >
          VISA
        </text>
      </svg>
    </MarkShell>
  );
}

function MastercardMark() {
  return (
    <MarkShell>
      <svg width="24" height="14" viewBox="0 0 28 18" aria-hidden="true">
        <circle cx="10" cy="9" r="7" fill="#EB001B" />
        <circle cx="18" cy="9" r="7" fill="#F79E1B" />
        <path fill="#FF5F00" d="M14 3.6a7 7 0 0 1 0 10.8 7 7 0 0 1 0-10.8z" />
      </svg>
    </MarkShell>
  );
}

function MaestroMark() {
  return (
    <MarkShell>
      <svg width="24" height="14" viewBox="0 0 28 18" aria-hidden="true">
        <circle cx="10" cy="9" r="7" fill="#0099DF" />
        <circle cx="18" cy="9" r="7" fill="#ED0006" />
        <path fill="#6C6BBD" d="M14 3.6a7 7 0 0 1 0 10.8 7 7 0 0 1 0-10.8z" />
      </svg>
    </MarkShell>
  );
}

function AmexMark() {
  return (
    <MarkShell>
      <svg width="24" height="14" viewBox="0 0 28 18" aria-hidden="true">
        <rect width="28" height="18" rx="2" fill="#2E77BC" />
        <text
          x="14"
          y="12"
          textAnchor="middle"
          fill="#fff"
          fontSize="7"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="700"
        >
          AMEX
        </text>
      </svg>
    </MarkShell>
  );
}
