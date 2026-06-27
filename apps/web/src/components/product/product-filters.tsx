import { type ProductCategory, categoryLabel } from '@akknerds/shared';
import { Button, Label, Separator, cn } from '@akknerds/ui';
import { RotateCcw } from 'lucide-react';
import type { CatalogMeta } from '../../lib/api';
import { type ProductFilters, isDefaultFilters } from '../../lib/filters';

interface ProductFiltersPanelProps {
  meta?: CatalogMeta;
  value: ProductFilters;
  onChange: (patch: Partial<ProductFilters>) => void;
  onReset: () => void;
}

export function ProductFiltersPanel({ meta, value, onChange, onReset }: ProductFiltersPanelProps) {
  const categories: { value: ProductCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All products' },
    ...(meta?.categories ?? []).map((c) => ({ value: c.value, label: categoryLabel(c.value) })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-foreground mb-2 text-sm font-semibold">Category</legend>
        <div className="flex flex-col gap-1">
          {categories.map((category) => {
            const active = value.category === category.value;
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => onChange({ category: category.value })}
                aria-pressed={active}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  active
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label htmlFor="series-filter">Series</Label>
        <select
          id="series-filter"
          value={value.series}
          onChange={(e) => onChange({ series: e.target.value })}
          className="border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/40 h-11 w-full appearance-none rounded-lg border px-3 text-sm focus-visible:outline-none focus-visible:ring-2"
        >
          <option value="">All series</option>
          {(meta?.series ?? []).map((series) => (
            <option key={series} value={series}>
              {series}
            </option>
          ))}
        </select>
      </div>

      <Separator />

      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={value.inStock}
          onChange={(e) => onChange({ inStock: e.target.checked })}
          className="border-input bg-background text-primary accent-primary size-4 rounded"
        />
        <span className="text-foreground font-medium">In stock only</span>
      </label>

      {!isDefaultFilters(value) && (
        <Button variant="ghost" size="sm" onClick={onReset} className="self-start">
          <RotateCcw /> Reset filters
        </Button>
      )}
    </div>
  );
}
