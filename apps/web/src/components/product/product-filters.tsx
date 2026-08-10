import {
  CARD_CONDITIONS,
  PRODUCT_LANGUAGES,
  type CardCondition,
  type ProductCategory,
  type ProductLanguage,
  categoryLabel,
  conditionLabel,
  languageLabel,
} from '@akknerds/shared';
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

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

function FilterChips<T extends string>({
  legend,
  value,
  options,
  onSelect,
}: {
  legend: string;
  value: T;
  options: ChipOption<T>[];
  onSelect: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-foreground mb-1 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value || 'all'}
              type="button"
              onClick={() => onSelect(option.value)}
              aria-pressed={active}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ProductFiltersPanel({ meta, value, onChange, onReset }: ProductFiltersPanelProps) {
  const categories: { value: ProductCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All products' },
    ...(meta?.categories ?? []).map((c) => ({ value: c.value, label: categoryLabel(c.value) })),
  ];

  const languageOptions: ChipOption<ProductLanguage | ''>[] = [
    { value: '', label: 'All' },
    ...PRODUCT_LANGUAGES.map((language) => ({
      value: language,
      label: languageLabel(language),
    })),
  ];

  const conditionOptions: ChipOption<CardCondition | ''>[] = [
    { value: '', label: 'All' },
    ...CARD_CONDITIONS.map((condition) => ({
      value: condition,
      label: conditionLabel(condition),
    })),
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

      <FilterChips
        legend="Language"
        value={value.language}
        options={languageOptions}
        onSelect={(language) => onChange({ language })}
      />

      <FilterChips
        legend="Condition"
        value={value.condition}
        options={conditionOptions}
        onSelect={(condition) => onChange({ condition })}
      />

      {!isDefaultFilters(value) && (
        <Button variant="ghost" size="sm" onClick={onReset} className="self-start">
          <RotateCcw /> Reset filters
        </Button>
      )}
    </div>
  );
}
