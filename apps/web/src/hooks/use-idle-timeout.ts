import { useEffect, useRef } from 'react';

const DEFAULT_EVENTS = [
  'pointerdown',
  'pointermove',
  'keydown',
  'touchstart',
  'scroll',
] as const;

/** Quieter set for kiosk screensaver — avoids cursor jitter blocking attract mode. */
export const KIOSK_IDLE_EVENTS = [
  'pointerdown',
  'keydown',
  'touchstart',
  'wheel',
  'scroll',
] as const;

/**
 * Fires `onIdle` after `timeoutMs` without pointer/keyboard/scroll activity.
 * Resets the timer on each qualifying event (capture phase, including scroll containers).
 */
export function useIdleTimeout(
  onIdle: () => void,
  timeoutMs = 60_000,
  enabled = true,
  events: readonly string[] = DEFAULT_EVENTS,
) {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!enabled || timeoutMs <= 0) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const arm = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => onIdleRef.current(), timeoutMs);
    };

    arm();
    for (const event of events) {
      window.addEventListener(event, arm, { capture: true, passive: true });
    }

    return () => {
      if (timer) clearTimeout(timer);
      for (const event of events) {
        window.removeEventListener(event, arm, { capture: true });
      }
    };
  }, [timeoutMs, enabled, events]);
}
