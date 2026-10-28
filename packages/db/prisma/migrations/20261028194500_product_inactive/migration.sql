-- Fully deactivated products: kept in admin, blocked from shop + till.
ALTER TABLE "products" ADD COLUMN "inactive" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "products_inactive_idx" ON "products"("inactive");
