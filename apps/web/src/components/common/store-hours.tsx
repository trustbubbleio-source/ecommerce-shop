import { cn } from '@akknerds/ui';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SITE } from '../../config/site';

type StoreHoursProps = {
  className?: string;
  /** Show the appointment / flexibility note under the list. */
  showNote?: boolean;
};

type StoreDay = (typeof SITE.store.hours)[number];

export type TodayStoreStatus =
  | { kind: 'open'; day: string; hours: string; opensAt: string }
  | { kind: 'closed'; day: string; nextDay: string; nextOpensAt: string };

/** Monday=0 … Sunday=6 in Europe/Stockholm. */
export function stockholmWeekdayIndex(now: Date = new Date()): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Stockholm',
    weekday: 'short',
  }).format(now);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[weekday] ?? 0;
}

function opensAt(hours: string): string {
  return hours.split('–')[0] ?? hours;
}

/** Today's open/closed status plus the next open slot when closed. */
export function getTodayStoreStatus(now: Date = new Date()): TodayStoreStatus {
  const idx = stockholmWeekdayIndex(now);
  const today = SITE.store.hours[idx] as StoreDay;

  if (today.open) {
    return {
      kind: 'open',
      day: today.day,
      hours: today.open,
      opensAt: opensAt(today.open),
    };
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const next = SITE.store.hours[(idx + offset) % 7] as StoreDay;
    if (next.open) {
      return {
        kind: 'closed',
        day: today.day,
        nextDay: next.day,
        nextOpensAt: opensAt(next.open),
      };
    }
  }

  return {
    kind: 'closed',
    day: today.day,
    nextDay: 'Tuesday',
    nextOpensAt: '13:00',
  };
}

export function todayStoreMessage(status: TodayStoreStatus = getTodayStoreStatus()): string {
  if (status.kind === 'open') {
    return `Today we're open ${status.hours}.`;
  }
  return `Today the store is closed. We open again ${status.nextDay} at ${status.nextOpensAt}.`;
}

/** Compact weekly opening hours for the Båstad store. */
export function StoreHours({ className, showNote = true }: StoreHoursProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <dl className="grid gap-1.5 text-sm sm:grid-cols-2 sm:gap-x-8">
        {SITE.store.hours.map(({ day, open }) => (
          <div key={day} className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">{day}</dt>
            <dd className="text-foreground font-medium tabular-nums">{open ?? 'Closed'}</dd>
          </div>
        ))}
      </dl>
      {showNote ? (
        <p className="text-foreground mx-auto mt-2 max-w-xl text-center text-base font-medium leading-relaxed sm:text-lg">
          {SITE.store.hoursNote}
        </p>
      ) : null}
    </div>
  );
}

/** Home teaser: today's hours only, with a link to the full Contact schedule. */
export function TodaysStoreHours({ className }: { className?: string }) {
  const status = getTodayStoreStatus();
  const message = todayStoreMessage(status);

  return (
    <div className={cn('mt-1 flex flex-col gap-2', className)}>
      <p className="text-foreground inline-flex items-center gap-2 text-sm font-semibold">
        <Clock className="size-4 shrink-0" aria-hidden />
        Opening hours
      </p>
      <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
      <Link
        to="/contact#opening-hours"
        className="text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline"
      >
        See full opening hours
      </Link>
    </div>
  );
}

/** One-line summary for chat / meta. */
export function storeHoursSummary(): string {
  return 'Tue–Thu 13:00–19:00, Fri 13:00–20:00, Sat 11:00–15:00; closed Mon & Sun. Special times by appointment.';
}
