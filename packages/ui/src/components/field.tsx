import { useId } from 'react';
import { cn } from '../lib/cn.js';
import { Label } from './label.js';

export interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  /** Render-prop receiving the resolved id + aria props to spread on the control. */
  children: (props: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  }) => React.ReactNode;
}

/**
 * Accessible form field: wires a label, control, and error/hint message together
 * with the correct `id` / `aria-describedby` / `aria-invalid` attributes.
 */
export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        {required && (
          <span className="text-primary" aria-hidden="true">
            *
          </span>
        )}
      </div>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': message ? messageId : undefined,
      })}
      {message && (
        <p
          id={messageId}
          className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}
          role={error ? 'alert' : undefined}
        >
          {message}
        </p>
      )}
    </div>
  );
}
