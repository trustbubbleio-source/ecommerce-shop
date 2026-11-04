-- Admin-managed promo codes (general or user-scoped).
CREATE TABLE IF NOT EXISTS "discount_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "allowed_email" TEXT,
    "allowed_user_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "discount_codes_code_key" ON "discount_codes"("code");
CREATE INDEX IF NOT EXISTS "discount_codes_active_idx" ON "discount_codes"("active");
