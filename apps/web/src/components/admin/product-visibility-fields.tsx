import type { ProductFormValues } from '../../pages/admin/product-form-common';

interface ProductVisibilityFieldsProps {
  value: Pick<ProductFormValues, 'featured' | 'isNew'>;
  onChange: (patch: Partial<Pick<ProductFormValues, 'featured' | 'isNew'>>) => void;
}

export function ProductVisibilityFields({ value, onChange }: ProductVisibilityFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-foreground text-sm font-medium">Homepage visibility</p>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card/40 p-3">
        <input
          type="checkbox"
          checked={value.featured}
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
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card/40 p-3">
        <input
          type="checkbox"
          checked={value.isNew}
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
  );
}
