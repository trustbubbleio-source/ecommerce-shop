-- Link catalogue rows to PayPal Zettle product library.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sku" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "zettle_product_uuid" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "zettle_variant_uuid" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_key" ON "products"("sku");
CREATE INDEX IF NOT EXISTS "products_zettle_variant_uuid_idx" ON "products"("zettle_variant_uuid");

-- Rename Stripe Checkout session column to provider-agnostic payment session id.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'stripe_session_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_session_id'
  ) THEN
    ALTER TABLE "orders" RENAME COLUMN "stripe_session_id" TO "payment_session_id";
  END IF;
END $$;
