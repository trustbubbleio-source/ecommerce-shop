import { cn } from '@akknerds/ui';

/** Minimal Pokéball glyph used as a decorative motif and brand mark. */
export function Pokeball({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-6', className)} aria-hidden="true" fill="none">
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" />
      <path d="M4 32 H22 a10 10 0 0 0 20 0 H60" stroke="currentColor" strokeWidth="4" />
      <circle cx="32" cy="32" r="7" stroke="currentColor" strokeWidth="4" fill="none" />
    </svg>
  );
}
