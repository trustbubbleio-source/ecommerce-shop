import { cn } from '@akknerds/ui';
import { Link } from 'react-router-dom';
import logo from '../../assets/rarity/onemorerip-logo-transparent-bg-white.png';
import { SITE } from '../../config/site';

type BrandSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<BrandSize, string> = {
  sm: 'h-9',
  md: 'h-11',
  lg: 'h-20',
};

export function Brand({
  className,
  size = 'md',
}: {
  className?: string;
  size?: BrandSize;
}) {
  return (
    <Link
      to="/"
      className={cn('group inline-flex shrink-0 items-center', className)}
      aria-label={`${SITE.name} home`}
    >
      <img
        src={logo}
        alt={SITE.name}
        className={cn(
          'w-auto object-contain transition-transform group-hover:scale-105',
          SIZE_CLASS[size],
        )}
      />
    </Link>
  );
}
