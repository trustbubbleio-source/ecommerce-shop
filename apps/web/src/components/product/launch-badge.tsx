import { cn } from '@akknerds/ui';
import { PRELAUNCH, isPrelaunchActive } from '../../config/launch';

/** Temporary centered badge — remove with the pre-launch config. */
export function LaunchBadge({ className }: { className?: string }) {
  if (!isPrelaunchActive()) return null;

  return (
    <span
      className={cn(
        'pointer-events-none absolute inset-0 z-10 flex items-center justify-center',
        className,
      )}
    >
      <span className="rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-md">
        {PRELAUNCH.badgeLabel}
      </span>
    </span>
  );
}
