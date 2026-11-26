import { cn, Skeleton } from '@akknerds/ui';
import { useEffect, useRef, useState } from 'react';
import { useKioskScrollRoot } from './scroll-root';

/**
 * Loads images only when near the kiosk scroll viewport.
 * Native loading="lazy" is unreliable inside overflow containers.
 */
export function KioskLazyImage({
  src,
  alt,
  className,
  /** First-row cards should paint immediately. */
  priority = false,
  placeholderColor,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  placeholderColor?: string;
}) {
  const root = useKioskScrollRoot();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(priority);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (priority || active) return;
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { root, rootMargin: '240px 0px', threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [priority, active, root]);

  return (
    <div
      ref={ref}
      className={cn('relative h-full w-full overflow-hidden', className)}
      style={
        !ready
          ? { background: placeholderColor ? `linear-gradient(150deg, ${placeholderColor}33, #0b0712)` : undefined }
          : undefined
      }
    >
      {!ready ? <Skeleton className="absolute inset-0 rounded-none" aria-hidden /> : null}
      {active ? (
        <img
          src={src}
          alt={alt}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setReady(true)}
          onError={() => setReady(true)}
          className={cn(
            'h-full w-full object-contain p-1 transition-opacity duration-200',
            ready ? 'opacity-100' : 'opacity-0',
          )}
        />
      ) : null}
    </div>
  );
}
