import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../lib/cn.js';

const alertVariants = cva('flex gap-3 rounded-lg border p-4 text-sm', {
  variants: {
    variant: {
      default: 'border-border bg-card text-card-foreground',
      info: 'border-primary/30 bg-primary/10 text-foreground',
      success: 'border-success/30 bg-success/10 text-foreground',
      destructive: 'border-destructive/30 bg-destructive/10 text-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  icon?: React.ReactNode;
}

export function Alert({ className, variant, icon, children, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {icon && <span className="mt-0.5 shrink-0 [&_svg]:size-5">{icon}</span>}
      <div className="flex-1">{children}</div>
    </div>
  );
}
