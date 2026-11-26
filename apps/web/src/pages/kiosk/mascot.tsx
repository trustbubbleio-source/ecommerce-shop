/** Original electric buddy for the kiosk attract screen — not official Pokémon art. */
export function KioskMascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <title>Electric buddy</title>
      {/* Ears */}
      <path d="M42 58 L28 18 L58 48 Z" fill="#F7D12E" stroke="#1a1a1a" strokeWidth="3" strokeLinejoin="round" />
      <path d="M118 58 L132 18 L102 48 Z" fill="#F7D12E" stroke="#1a1a1a" strokeWidth="3" strokeLinejoin="round" />
      <path d="M42 52 L34 28 L52 46 Z" fill="#1a1a1a" />
      <path d="M118 52 L126 28 L108 46 Z" fill="#1a1a1a" />
      {/* Head / body */}
      <circle cx="80" cy="88" r="48" fill="#F7D12E" stroke="#1a1a1a" strokeWidth="3.5" />
      {/* Cheeks */}
      <circle cx="48" cy="96" r="10" fill="#E85D4C" opacity="0.95" />
      <circle cx="112" cy="96" r="10" fill="#E85D4C" opacity="0.95" />
      {/* Eyes */}
      <circle cx="64" cy="82" r="7" fill="#1a1a1a" />
      <circle cx="96" cy="82" r="7" fill="#1a1a1a" />
      <circle cx="66" cy="80" r="2.2" fill="#fff" />
      <circle cx="98" cy="80" r="2.2" fill="#fff" />
      {/* Smile */}
      <path
        d="M66 104 Q80 116 94 104"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Tiny nose */}
      <ellipse cx="80" cy="94" rx="3" ry="2.2" fill="#1a1a1a" />
      {/* Lightning bolt badge */}
      <path
        d="M88 118 L78 138 L84 138 L76 154 L96 128 L88 128 L96 118 Z"
        fill="#fff"
        stroke="#1a1a1a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KioskSpark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 48" className={className} aria-hidden="true" fill="none">
      <path
        d="M18 2 L8 24 H16 L12 46 L26 20 H17 L22 2 Z"
        fill="#F7D12E"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
