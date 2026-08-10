import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { cn } from '../lib/cn.js';

export interface ImageLightboxProps {
  /** Full image URLs to display, in order. */
  images: string[];
  /** Whether the lightbox is open. */
  open: boolean;
  /** Called when the open state should change (backdrop click, Esc, close button). */
  onOpenChange: (open: boolean) => void;
  /** Index of the currently shown image (controlled). */
  index: number;
  /** Called when the viewer navigates to a different image. */
  onIndexChange: (index: number) => void;
  /** Accessible label / alt text for the images (e.g. the product name). */
  alt?: string;
  className?: string;
}

const SWIPE_THRESHOLD = 50;

/**
 * Fullscreen image viewer built on the Dialog primitive.
 *
 * Controlled: the caller owns `index`, so the same source of truth can drive a
 * thumbnail rail and the lightbox at once. With more than one image it exposes
 * prev/next controls, arrow-key navigation, touch swipe and a thumbnail strip.
 */
export function ImageLightbox({
  images,
  open,
  onOpenChange,
  index,
  onIndexChange,
  alt = '',
  className,
}: ImageLightboxProps) {
  const count = images.length;
  const hasMultiple = count > 1;
  const safeIndex = Math.min(Math.max(index, 0), Math.max(count - 1, 0));
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      onIndexChange((safeIndex + delta + count) % count);
    },
    [count, safeIndex, onIndexChange],
  );

  // Arrow-key navigation while open. Esc + focus trapping are handled by Radix.
  useEffect(() => {
    if (!open || !hasMultiple) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, hasMultiple, go]);

  if (count === 0) return null;

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const edgeButton =
    'absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white/90 ' +
    'backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-white/60';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            'fixed inset-0 z-50 flex flex-col focus:outline-none',
            'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
            className,
          )}
        >
          <DialogPrimitive.Title className="sr-only">{alt || 'Image viewer'}</DialogPrimitive.Title>

          {hasMultiple && (
            <span className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
              {safeIndex + 1} / {count}
            </span>
          )}

          <DialogPrimitive.Close
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white/90 backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Close"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>

          {/* Stage — clicking the empty area (backdrop) closes the viewer. */}
          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-10"
            onClick={(event) => {
              if (event.target === event.currentTarget) onOpenChange(false);
            }}
            onTouchStart={hasMultiple ? handleTouchStart : undefined}
            onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
          >
            <img
              src={images[safeIndex]}
              alt={alt}
              className="max-h-full max-w-full select-none object-contain"
              draggable={false}
            />

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous image"
                  className={cn(edgeButton, 'left-4')}
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next image"
                  className={cn(edgeButton, 'right-4')}
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>

          {hasMultiple && (
            <div className="no-scrollbar flex shrink-0 justify-center gap-2 overflow-x-auto p-4">
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => onIndexChange(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={i === safeIndex}
                  className={cn(
                    'size-14 shrink-0 overflow-hidden rounded-lg border bg-white/5 transition-opacity',
                    i === safeIndex
                      ? 'border-white ring-2 ring-white/80'
                      : 'border-white/20 opacity-60 hover:opacity-100',
                  )}
                >
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="size-full object-contain"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
