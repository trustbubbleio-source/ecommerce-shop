import { PRODUCT_TAGS, tagLabel, type ProductTag } from '@akknerds/shared';
import { cn } from '@akknerds/ui';

const MAX_TAGS = 12;

interface ProductTagPickerProps {
  value: ProductTag[];
  onChange: (tags: ProductTag[]) => void;
  error?: string;
}

export function ProductTagPicker({ value, onChange, error }: ProductTagPickerProps) {
  const atLimit = value.length >= MAX_TAGS;

  const toggle = (tag: ProductTag) => {
    if (value.includes(tag)) {
      onChange(value.filter((item) => item !== tag));
      return;
    }
    if (atLimit) return;
    onChange([...value, tag]);
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-foreground text-sm font-medium">Tags</legend>
      <p className="text-muted-foreground text-xs">
        Click to add — helps customers find products in search. Up to {MAX_TAGS}.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PRODUCT_TAGS.map((tag) => {
          const active = value.includes(tag);
          const disabled = !active && atLimit;
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => toggle(tag)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'bg-secondary text-muted-foreground hover:text-foreground',
                disabled && 'cursor-not-allowed opacity-40',
              )}
            >
              {tagLabel(tag)}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p className="text-muted-foreground text-xs">
          {value.length} selected: {value.map(tagLabel).join(', ')}
        </p>
      )}
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function normalizeProductTags(tags: string[]): ProductTag[] {
  const allowed = new Set<string>(PRODUCT_TAGS);
  return tags.filter((tag): tag is ProductTag => allowed.has(tag));
}
