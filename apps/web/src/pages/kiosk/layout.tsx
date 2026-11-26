import { useCallback, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { KIOSK_IDLE_EVENTS, useIdleTimeout } from '../../hooks/use-idle-timeout';
import { KioskScreensaver } from './screensaver';

const SCREENSAVER_MS = 15_000;

/** Full-viewport kiosk shell — no storefront chrome, cart, or auth. */
export function KioskLayout() {
  const navigate = useNavigate();
  const [screensaver, setScreensaver] = useState(false);

  const showScreensaver = useCallback(() => {
    setScreensaver(true);
    navigate('/kiosk', { replace: true });
  }, [navigate]);

  useIdleTimeout(showScreensaver, SCREENSAVER_MS, !screensaver, KIOSK_IDLE_EVENTS);

  return (
    <div className="bg-background text-foreground flex h-dvh flex-col overflow-hidden">
      <Outlet />
      {screensaver ? <KioskScreensaver onDismiss={() => setScreensaver(false)} /> : null}
    </div>
  );
}
