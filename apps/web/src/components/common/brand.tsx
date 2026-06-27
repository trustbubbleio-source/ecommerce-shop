import { cn } from '@akknerds/ui';
import { Link } from 'react-router-dom';
import { SITE } from '../../config/site';
import { Pokeball } from './pokeball';

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        'group inline-flex items-center gap-2 font-extrabold tracking-tight',
        className,
      )}
      aria-label={`${SITE.name} home`}
    >
      <span className="bg-primary text-primary-foreground shadow-glow grid size-9 place-items-center rounded-lg transition-transform group-hover:scale-105">
        <Pokeball className="size-5" />
      </span>
      <span className="text-lg">
        <span className="text-foreground">akk</span>
        <span className="text-gradient">NERDS</span>
      </span>
    </Link>
  );
}
