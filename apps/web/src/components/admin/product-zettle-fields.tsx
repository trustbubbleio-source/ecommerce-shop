import { Field, Input } from '@akknerds/ui';
import type { ProductFormValues } from '../../pages/admin/product-form-common';

type ZettleFields = Pick<
  ProductFormValues,
  'sku' | 'zettleProductUuid' | 'zettleVariantUuid'
>;

interface ProductZettleFieldsProps {
  value: ZettleFields;
  errors: Partial<Record<keyof ZettleFields, string>>;
  onChange: (patch: Partial<ZettleFields>) => void;
}

/**
 * PayPal Zettle link fields — SKU + product/variant UUIDs from the POS library.
 * Required for stock sync between web checkout and the Båstad till.
 */
export function ProductZettleFields({ value, errors, onChange }: ProductZettleFieldsProps) {
  const linked = Boolean(
    value.sku.trim() && value.zettleProductUuid.trim() && value.zettleVariantUuid.trim(),
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Create the product in PayPal Zettle first, then paste matching values here so web and till
        share stock. Leave blank for web-only items.
      </p>
      <p
        className={
          linked
            ? 'text-sm font-medium text-emerald-400'
            : 'text-muted-foreground text-sm font-medium'
        }
      >
        {linked ? 'Linked to Zettle — stock will sync.' : 'Not linked — stock stays web-only.'}
      </p>
      <Field
        label="SKU"
        error={errors.sku}
        hint="Same SKU as in Zettle (e.g. BP-006 or GOWELL-001)."
      >
        {(props) => (
          <Input
            {...props}
            value={value.sku}
            onChange={(e) => onChange({ sku: e.target.value })}
            placeholder="BP-006"
            autoComplete="off"
            spellCheck={false}
          />
        )}
      </Field>
      <Field
        label="Zettle product UUID"
        error={errors.zettleProductUuid}
        hint="Produkt id from the Zettle product export."
      >
        {(props) => (
          <Input
            {...props}
            value={value.zettleProductUuid}
            onChange={(e) => onChange({ zettleProductUuid: e.target.value.trim() })}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            autoComplete="off"
            spellCheck={false}
            className="font-mono text-sm"
          />
        )}
      </Field>
      <Field
        label="Zettle variant UUID"
        error={errors.zettleVariantUuid}
        hint="Variant id from the Zettle product export — used for inventory sync."
      >
        {(props) => (
          <Input
            {...props}
            value={value.zettleVariantUuid}
            onChange={(e) => onChange({ zettleVariantUuid: e.target.value.trim() })}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            autoComplete="off"
            spellCheck={false}
            className="font-mono text-sm"
          />
        )}
      </Field>
    </div>
  );
}
