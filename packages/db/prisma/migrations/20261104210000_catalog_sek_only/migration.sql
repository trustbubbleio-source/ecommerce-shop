-- Store money as SEK öre only. Convert legacy EUR (and usd-as-eur) catalogue
-- rows and EUR order ledgers with the former display rate 11.3.

ALTER TABLE "products" ALTER COLUMN "currency" SET DEFAULT 'sek';

UPDATE "products"
SET
  "price" = ROUND("price" * 11.3),
  "compare_at_price" = CASE
    WHEN "compare_at_price" IS NOT NULL THEN ROUND("compare_at_price" * 11.3)
    ELSE NULL
  END,
  "currency" = 'sek'
WHERE lower("currency") IN ('eur', 'usd');

UPDATE "orders"
SET
  "lines" = (
    SELECT COALESCE(
      jsonb_agg(
        CASE
          WHEN elem ? 'unitPrice' THEN
            jsonb_set(
              elem,
              '{unitPrice}',
              to_jsonb(ROUND((elem->>'unitPrice')::numeric * 11.3)::int)
            )
          ELSE elem
        END
      ),
      '[]'::jsonb
    )
    FROM jsonb_array_elements("lines") AS elem
  ),
  "subtotal" = ROUND("subtotal" * 11.3),
  "shipping" = ROUND("shipping" * 11.3),
  "total" = ROUND("total" * 11.3),
  "currency" = 'sek'
WHERE lower("currency") = 'eur';

UPDATE "discount_codes"
SET "value" = ROUND("value" * 11.3)
WHERE "kind" = 'fixed';

UPDATE "profiles"
SET "preferred_currency" = 'sek'
WHERE lower("preferred_currency") <> 'sek';
