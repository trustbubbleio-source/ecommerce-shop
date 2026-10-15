-- Speed up shop list filters / sorts (H10).
CREATE INDEX IF NOT EXISTS "products_price_idx" ON "products"("price");
CREATE INDEX IF NOT EXISTS "products_stock_idx" ON "products"("stock");
CREATE INDEX IF NOT EXISTS "products_release_date_idx" ON "products"("release_date");
CREATE INDEX IF NOT EXISTS "products_rating_idx" ON "products"("rating");
CREATE INDEX IF NOT EXISTS "products_language_idx" ON "products"("language");
CREATE INDEX IF NOT EXISTS "products_condition_idx" ON "products"("condition");
