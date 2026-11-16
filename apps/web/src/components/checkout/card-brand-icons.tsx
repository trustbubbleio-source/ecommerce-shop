/** Compact card-network marks — identical outer tiles so the row stays level. */
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

const TILE = 'block h-5 w-8 shrink-0 overflow-hidden rounded-[3px] shadow-sm';

function VisaMark() {
  return (
    <svg className={TILE} viewBox="0 0 32 20" aria-hidden="true">
      <rect width="32" height="20" fill="#1A1F71" />
      <text
        x="16"
        y="13.5"
        textAnchor="middle"
        fill="#fff"
        fontSize="8"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        letterSpacing="0.8"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardMark() {
  return (
    <svg className={`${TILE} bg-white`} viewBox="0 0 32 20" aria-hidden="true">
      <rect width="32" height="20" fill="#fff" />
      <circle cx="12.5" cy="10" r="6" fill="#EB001B" />
      <circle cx="19.5" cy="10" r="6" fill="#F79E1B" />
      <path fill="#FF5F00" d="M16 5.2a6 6 0 0 1 0 9.6 6 6 0 0 1 0-9.6z" />
    </svg>
  );
}

function MaestroMark() {
  return (
    <svg className={`${TILE} bg-white`} viewBox="0 0 32 20" aria-hidden="true">
      <rect width="32" height="20" fill="#fff" />
      <circle cx="12.5" cy="10" r="6" fill="#0099DF" />
      <circle cx="19.5" cy="10" r="6" fill="#ED0006" />
      <path fill="#6C6BBD" d="M16 5.2a6 6 0 0 1 0 9.6 6 6 0 0 1 0-9.6z" />
    </svg>
  );
}

function AmexMark() {
  return (
    <svg className={TILE} viewBox="0 0 32 20" aria-hidden="true">
      <rect width="32" height="20" fill="#2E77BC" />
      <text
        x="16"
        y="13.5"
        textAnchor="middle"
        fill="#fff"
        fontSize="7"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        letterSpacing="0.4"
      >
        AMEX
      </text>
    </svg>
  );
}
