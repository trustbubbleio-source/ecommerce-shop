-- AlterTable
ALTER TABLE "newsletter_subscribers" ADD COLUMN "unsubscribe_token" TEXT;

-- Backfill existing rows
UPDATE "newsletter_subscribers"
SET "unsubscribe_token" = encode(gen_random_bytes(16), 'hex')
WHERE "unsubscribe_token" IS NULL;

-- Enforce uniqueness
ALTER TABLE "newsletter_subscribers" ALTER COLUMN "unsubscribe_token" SET NOT NULL;

CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribe_token_key" ON "newsletter_subscribers"("unsubscribe_token");
