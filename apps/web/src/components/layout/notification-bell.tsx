import type { AppNotification } from '@akknerds/shared';
import { cn } from '@akknerds/ui';
import { Bell } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarkNotificationsRead, useNotifications } from '../../hooks/use-notifications';
import { useAuthStore } from '../../store/auth';

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16);
  }
}

function NotificationRow({
  item,
  onNavigate,
}: {
  item: AppNotification;
  onNavigate: () => void;
}) {
  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={cn(
        'hover:bg-secondary/80 block border-b border-border/60 px-3 py-2.5 transition-colors last:border-b-0',
        !item.readAt && 'bg-primary/5',
      )}
    >
      <p className="text-foreground text-sm font-semibold">{item.title}</p>
      <p className="text-muted-foreground mt-0.5 text-xs leading-snug">{item.body}</p>
      <p className="text-muted-foreground/80 mt-1 text-[11px]">{formatWhen(item.createdAt)}</p>
    </Link>
  );
}

export function NotificationBell() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const unread = data?.unreadCount ?? 0;
  const items = data?.notifications ?? [];

  const openPanel = () => {
    setOpen(true);
    if (unread > 0) markRead.mutate(undefined);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={cn(
          'relative inline-flex size-11 items-center justify-center rounded-lg text-sm font-semibold transition-all',
          'hover:bg-secondary focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'active:scale-[0.98]',
        )}
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="bg-primary text-primary-foreground absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold leading-4">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Order notifications"
          className="border-border bg-popover absolute right-0 top-full z-50 mt-1 w-[min(100vw-1.5rem,20rem)] overflow-hidden rounded-xl border shadow-lg"
        >
          <div className="border-border flex items-center justify-between border-b px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            <Link
              to="/account/orders"
              onClick={() => setOpen(false)}
              className="text-primary text-xs font-medium hover:underline"
            >
              Orders
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {isLoading && items.length === 0 ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                No order updates yet.
              </p>
            ) : (
              items.map((item) => (
                <NotificationRow key={item.id} item={item} onNavigate={() => setOpen(false)} />
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
