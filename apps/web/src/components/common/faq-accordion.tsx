import { cn } from '@akknerds/ui';
import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';

interface FaqAccordionItemProps {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

export function FaqAccordionItem({ question, answer, defaultOpen = false }: FaqAccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const buttonId = useId();

  return (
    <div
      className={cn(
        'border-border bg-card/60 rounded-xl border transition-colors',
        open && 'border-primary/30 bg-card shadow-[0_0_40px_-20px_hsl(var(--primary)/0.4)]',
      )}
    >
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="tap-highlight-none flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold sm:px-5 sm:py-5 sm:text-base"
        >
          <span className="text-foreground">{question}</span>
          <ChevronDown
            aria-hidden
            className={cn(
              'text-muted-foreground size-5 shrink-0 transition-transform duration-200',
              open && 'text-primary rotate-180',
            )}
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <p className="text-muted-foreground px-4 pb-4 text-sm leading-relaxed sm:px-5 sm:pb-5 sm:text-[0.9375rem]">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
