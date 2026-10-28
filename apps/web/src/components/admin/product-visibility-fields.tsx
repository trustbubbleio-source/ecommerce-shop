import { cn } from '@akknerds/ui';
import type { ProductFormValues } from '../../pages/admin/product-form-common';

interface ProductVisibilityFieldsProps {
  value: Pick<ProductFormValues, 'featured' | 'isNew' | 'storeOnly' | 'inactive'>;
  onChange: (
    patch: Partial<Pick<ProductFormValues, 'featured' | 'isNew' | 'storeOnly' | 'inactive'>>,
  ) => void;
}

export function ProductVisibilityFields({ value, onChange }: ProductVisibilityFieldsProps) {
  const channelDisabled = value.inactive;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-foreground text-sm font-medium">Sales channel</p>
        <p className="text-muted-foreground text-xs">
          Choose where this product can be sold. You can change this anytime.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <ChannelOption
            selected={!value.storeOnly}
            disabled={channelDisabled}
            title="Webshop + store"
            description="Visible in the online shop and usable with QR / in-store till."
            onSelect={() => onChange({ storeOnly: false })}
          />
          <ChannelOption
            selected={value.storeOnly}
            disabled={channelDisabled}
            title="Store only"
            description="Hidden from the webshop. Still available for QR codes and till sales."
            onSelect={() => onChange({ storeOnly: true, featured: false, isNew: false })}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card/40 p-3">
        <input
          type="checkbox"
          checked={value.inactive}
          onChange={(e) => {
            const inactive = e.target.checked;
            onChange(
              inactive
                ? { inactive: true, featured: false, isNew: false }
                : { inactive: false },
            );
          }}
          className="border-input bg-background text-primary accent-primary mt-0.5 size-4 shrink-0 rounded"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm font-medium">Deactivate completely</span>
          <span className="text-muted-foreground text-xs">
            Turns the product off everywhere — not shown online and not sellable in-store. Keep it
            if you may reactivate later; use Delete to remove it permanently.
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-3">
        <p className="text-foreground text-sm font-medium">Homepage highlights</p>
        <label
          className={cn(
            'flex items-start gap-3 rounded-lg border border-border bg-card/40 p-3',
            value.storeOnly || value.inactive
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer',
          )}
        >
          <input
            type="checkbox"
            checked={value.featured}
            disabled={value.storeOnly || value.inactive}
            onChange={(e) => onChange({ featured: e.target.checked })}
            className="border-input bg-background text-primary accent-primary mt-0.5 size-4 shrink-0 rounded"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-foreground text-sm font-medium">Featured</span>
            <span className="text-muted-foreground text-xs">
              Shows in the &quot;Featured products&quot; section on the home page.
            </span>
          </span>
        </label>
        <label
          className={cn(
            'flex items-start gap-3 rounded-lg border border-border bg-card/40 p-3',
            value.storeOnly || value.inactive
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer',
          )}
        >
          <input
            type="checkbox"
            checked={value.isNew}
            disabled={value.storeOnly || value.inactive}
            onChange={(e) => onChange({ isNew: e.target.checked })}
            className="border-input bg-background text-primary accent-primary mt-0.5 size-4 shrink-0 rounded"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-foreground text-sm font-medium">New arrival</span>
            <span className="text-muted-foreground text-xs">
              Shows in the &quot;New arrivals&quot; section on the home page.
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}

function ChannelOption({
  selected,
  disabled,
  title,
  description,
  onSelect,
}: {
  selected: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'rounded-lg border p-3 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border bg-card/40 hover:border-foreground/30',
        disabled && 'cursor-not-allowed opacity-50',
      )}
      aria-pressed={selected}
    >
      <span className="text-foreground block text-sm font-medium">{title}</span>
      <span className="text-muted-foreground mt-0.5 block text-xs">{description}</span>
    </button>
  );
}
