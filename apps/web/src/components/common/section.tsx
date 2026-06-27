import { cn } from '@akknerds/ui';
import { Link } from 'react-router-dom';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; to: string };
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-6 flex items-end justify-between gap-4', className)}>
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="text-primary shrink-0 text-sm font-semibold hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
