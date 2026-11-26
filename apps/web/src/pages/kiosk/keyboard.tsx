import { cn } from '@akknerds/ui';
import { Delete } from 'lucide-react';
import type { ReactNode } from 'react';

const ROW_1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const;
const ROW_2 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'] as const;
const ROW_3 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'] as const;
const ROW_4 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'] as const;

function Key({
  label,
  ariaLabel,
  onPress,
  className,
  children,
}: {
  label?: string;
  ariaLabel: string;
  onPress: () => void;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        'tap-highlight-none flex h-14 min-w-0 flex-1 items-center justify-center rounded-xl',
        'bg-white/10 text-xl font-semibold text-white active:bg-white/25',
        'border border-white/10',
        className,
      )}
      onPointerDown={(e) => {
        // Keep search field focus / avoid click-outside races on touch.
        e.preventDefault();
        onPress();
      }}
    >
      {children ?? label}
    </button>
  );
}

interface KioskKeyboardProps {
  onType: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onDone: () => void;
}

/** Large on-screen keyboard for kiosk search (Windows OSK is often blocked in kiosk mode). */
export function KioskKeyboard({ onType, onBackspace, onClear, onDone }: KioskKeyboardProps) {
  return (
    <div
      className="border-border/40 bg-background/95 shrink-0 border-t px-3 pb-4 pt-3 backdrop-blur-md"
      role="group"
      aria-label="On-screen keyboard"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-2">
        <div className="flex gap-1.5">
          {ROW_1.map((key) => (
            <Key key={key} label={key} ariaLabel={key} onPress={() => onType(key)} />
          ))}
        </div>
        <div className="flex gap-1.5">
          {ROW_2.map((key) => (
            <Key key={key} label={key} ariaLabel={key} onPress={() => onType(key)} />
          ))}
        </div>
        <div className="flex gap-1.5 px-4">
          {ROW_3.map((key) => (
            <Key key={key} label={key} ariaLabel={key} onPress={() => onType(key)} />
          ))}
        </div>
        <div className="flex gap-1.5 px-10">
          {ROW_4.map((key) => (
            <Key key={key} label={key} ariaLabel={key} onPress={() => onType(key)} />
          ))}
          <Key ariaLabel="Backspace" onPress={onBackspace} className="max-w-[5.5rem] flex-[1.4]">
            <Delete className="size-6" />
          </Key>
        </div>
        <div className="flex gap-1.5">
          <Key ariaLabel="Clear search" onPress={onClear} className="max-w-[7rem] flex-[1.2] text-base">
            Clear
          </Key>
          <Key ariaLabel="Space" onPress={() => onType(' ')} className="flex-[4] text-base tracking-[0.3em]">
            space
          </Key>
          <Key
            ariaLabel="Done"
            onPress={onDone}
            className="max-w-[8rem] flex-[1.4] bg-primary/90 text-primary-foreground active:bg-primary"
          >
            Done
          </Key>
        </div>
      </div>
    </div>
  );
}
