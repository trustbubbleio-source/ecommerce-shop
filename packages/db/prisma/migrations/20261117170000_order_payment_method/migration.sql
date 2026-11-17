-- Persist which online checkout method paid the order (Google Pay, card, PayPal, …).
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" TEXT;
