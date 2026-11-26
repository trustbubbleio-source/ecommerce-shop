import { Outlet, useNavigate } from 'react-router-dom';
import { useIdleTimeout } from '../../hooks/use-idle-timeout';

const IDLE_MS = 60_000;

/** Full-viewport kiosk shell — no storefront chrome, cart, or auth. */
export function KioskLayout() {
  const navigate = useNavigate();

  useIdleTimeout(() => {
    navigate('/kiosk', { replace: true });
  }, IDLE_MS);

  return (
    <div className="bg-background text-foreground flex h-dvh flex-col overflow-hidden">
      <Outlet />
    </div>
  );
}
