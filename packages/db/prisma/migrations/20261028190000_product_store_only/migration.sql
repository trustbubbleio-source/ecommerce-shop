-- Store-only / offline products: kept for admin QR + till, hidden from the public shop.
ALTER TABLE "products" ADD COLUMN "store_only" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "products_store_only_idx" ON "products"("store_only");
