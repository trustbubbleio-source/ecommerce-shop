import { type ProductLanguage, languageLabel } from '@akknerds/shared';
import { cn } from '@akknerds/ui';

interface LanguageFlagProps {
  language: ProductLanguage;
  className?: string;
}

/** Circular colored flag — language at a glance on shop cards. */
export function LanguageFlag({ language, className }: LanguageFlagProps) {
  const label = languageLabel(language);

  return (
    <span
      className={cn(
        'pointer-events-none inline-flex size-5 overflow-hidden rounded-full shadow-sm ring-1 ring-black/25',
        className,
      )}
      title={label}
      aria-hidden="true"
      data-language={language}
    >
      <FlagSvg language={language} />
    </span>
  );
}

function FlagSvg({ language }: { language: ProductLanguage }) {
  switch (language) {
    case 'japanese':
      return <JapanFlag />;
    case 'chinese':
      return <ChinaFlag />;
    case 'english':
    default:
      return <UkFlag />;
  }
}

function UkFlag() {
  return (
    <svg viewBox="0 0 60 60" className="size-full" aria-hidden="true">
      <rect width="60" height="60" fill="#012169" />
      <path d="M0 0 L60 60 M60 0 L0 60" stroke="#fff" strokeWidth="10" />
      <path d="M0 0 L60 60 M60 0 L0 60" stroke="#C8102E" strokeWidth="6" />
      <path d="M30 0 V60 M0 30 H60" stroke="#fff" strokeWidth="16" />
      <path d="M30 0 V60 M0 30 H60" stroke="#C8102E" strokeWidth="9" />
    </svg>
  );
}

function JapanFlag() {
  return (
    <svg viewBox="0 0 60 60" className="size-full" aria-hidden="true">
      <rect width="60" height="60" fill="#fff" />
      <circle cx="30" cy="30" r="14" fill="#BC002D" />
    </svg>
  );
}

function ChinaFlag() {
  return (
    <svg viewBox="0 0 60 60" className="size-full" aria-hidden="true">
      <rect width="60" height="60" fill="#DE2910" />
      <path
        fill="#FFDE00"
        d="M16 12 L17.5 16.6 H22.4 L18.45 19.4 L20 24 L16 21.2 L12 24 L13.55 19.4 L9.6 16.6 H14.5 Z"
      />
    </svg>
  );
}
