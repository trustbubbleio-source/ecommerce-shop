import { cn } from '@akknerds/ui';
import { useId } from 'react';
import { useFormatMoney } from '../../hooks/use-format-money';

export interface PriceHistoryPoint {
  /** Month label, e.g. "Mar" */
  label: string;
  /** Price in EUR cents */
  priceCents: number;
}

interface ProductPriceHistoryProps {
  productId: string;
  /** Current catalogue price (EUR cents) — anchors the mock series. */
  currentPriceCents: number;
  className?: string;
}

const MONTH_LABELS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'] as const;

/** Deterministic 0–1 from a string (stable mock series per product). */
function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** UI preview only — replaces with stored history when the cron lands. */
export function buildMockPriceHistory(
  productId: string,
  currentPriceCents: number,
): PriceHistoryPoint[] {
  const seed = hash01(productId);
  const drift = 0.12 + seed * 0.1;
  const wave = 0.04 + seed * 0.03;

  return MONTH_LABELS.map((label, index) => {
    const t = index / (MONTH_LABELS.length - 1);
    const curve = 1 - drift * (1 - t) + Math.sin(t * Math.PI * 1.4 + seed * 6) * wave;
    const priceCents = Math.max(50, Math.round(currentPriceCents * curve));
    return { label, priceCents };
  });
}

function buildPath(
  points: PriceHistoryPoint[],
  width: number,
  height: number,
  padX: number,
  padY: number,
): { line: string; area: string; coords: { x: number; y: number }[] } {
  const prices = points.map((p) => p.priceCents);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(max - min, 1);
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const coords = points.map((point, i) => {
    const x = padX + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = padY + (1 - (point.priceCents - min) / range) * innerH;
    return { x, y };
  });

  const line = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');
  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  const area = `${line} L ${last.x.toFixed(1)} ${(height - padY / 2).toFixed(1)} L ${first.x.toFixed(1)} ${(height - padY / 2).toFixed(1)} Z`;

  return { line, area, coords };
}

export function ProductPriceHistory({
  productId,
  currentPriceCents,
  className,
}: ProductPriceHistoryProps) {
  const formatMoney = useFormatMoney();
  const gradientId = useId().replace(/:/g, '');
  const points = buildMockPriceHistory(productId, currentPriceCents);

  const width = 640;
  const height = 220;
  const padX = 12;
  const padY = 28;
  const { line, area, coords } = buildPath(points, width, height, padX, padY);

  const low = Math.min(...points.map((p) => p.priceCents));
  const high = Math.max(...points.map((p) => p.priceCents));
  const last = points[points.length - 1]!.priceCents;
  const lastCoord = coords[coords.length - 1]!;

  return (
    <section className={cn('mt-16', className)} aria-labelledby="price-history-heading">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="price-history-heading" className="text-xl font-bold tracking-tight">
            Market price
          </h2>
          <span className="border-border text-muted-foreground rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide">
            Preview
          </span>
        </div>
          <p className="text-muted-foreground mt-1 text-sm">Last 6 months</p>
      </div>

      <div className="border-border from-card to-background overflow-hidden rounded-2xl border bg-gradient-to-b via-card">
        <div className="grid grid-cols-3 gap-px border-b border-border bg-border/60">
          <Stat label="Now" value={formatMoney(last)} />
          <Stat label="6 mo low" value={formatMoney(low)} />
          <Stat label="6 mo high" value={formatMoney(high)} />
        </div>

        <div className="relative px-3 pb-2 pt-4 sm:px-5">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="text-primary h-48 w-full sm:h-56"
            role="img"
            aria-label="Price history over the last six months"
          >
            <defs>
              <linearGradient id={`fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id={`stroke-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(264 72% 68%)" />
                <stop offset="100%" stopColor="hsl(280 80% 62%)" />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75].map((t) => {
              const y = padY + t * (height - padY * 2);
              return (
                <line
                  key={t}
                  x1={padX}
                  x2={width - padX}
                  y1={y}
                  y2={y}
                  className="stroke-border"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
              );
            })}

            <path d={area} fill={`url(#fill-${gradientId})`} />
            <path
              d={line}
              fill="none"
              stroke={`url(#stroke-${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <circle
              cx={lastCoord.x}
              cy={lastCoord.y}
              r="5"
              className="fill-background stroke-primary"
              strokeWidth="2.5"
            />

            {points.map((point, i) => (
              <text
                key={point.label}
                x={coords[i]!.x}
                y={height - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px]"
              >
                {point.label}
              </text>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card/80 px-3 py-3 sm:px-5">
      <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums sm:text-base">{value}</p>
    </div>
  );
}
