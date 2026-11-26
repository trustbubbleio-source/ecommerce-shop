import { cn, Skeleton } from '@akknerds/ui';
import { api } from '@akknerds/api-client';
import { useEffect, useRef, useState } from 'react';
import { useKioskScrollRoot } from './scroll-root';

/**
 * Loads images only when near the kiosk scroll viewport.
 * Prefers a CDN WebP thumb, falls back to the full original, and warms the thumb for next time.
 */
export function KioskLazyImage({
  src,
  thumbSrc,
  imageKey,
  alt,
  className,
  /** First-row cards should paint immediately. */
  priority = false,
  placeholderColor,
}: {
  src: string;
  /** Smaller WebP on the CDN when available. */
  thumbSrc?: string;
  /** S3 object key used to backfill missing thumbs. */
  imageKey?: string;
  alt: string;
  className?: string;
  priority?: boolean;
  placeholderColor?: string;
}) {
  const root = useKioskScrollRoot();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(priority);
  const [ready, setReady] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(thumbSrc || src);
  const triedThumb = useRef(Boolean(thumbSrc));

  useEffect(() => {
    setCurrentSrc(thumbSrc || src);
    setReady(false);
    triedThumb.current = Boolean(thumbSrc);
  }, [src, thumbSrc]);

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
          ? {
              background: placeholderColor
                ? `linear-gradient(150deg, ${placeholderColor}33, #0b0712)`
                : undefined,
            }
          : undefined
      }
    >
      {!ready ? <Skeleton className="absolute inset-0 rounded-none" aria-hidden /> : null}
      {active ? (
        <img
          src={currentSrc}
          alt={alt}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setReady(true)}
          onError={() => {
            if (triedThumb.current && currentSrc !== src) {
              triedThumb.current = false;
              setCurrentSrc(src);
              if (imageKey) {
                void api.ensureProductThumb(imageKey).catch(() => {
                  // Best-effort backfill; grid already fell back to the original.
                });
              }
              return;
            }
            setReady(true);
          }}
          className={cn(
            'h-full w-full object-contain p-1 transition-opacity duration-200',
            ready ? 'opacity-100' : 'opacity-0',
          )}
        />
      ) : null}
    </div>
  );
}
