-- Sweden-first: new profiles default to SEK; migrate existing EUR preferences.
ALTER TABLE "profiles" ALTER COLUMN "preferred_currency" SET DEFAULT 'sek';
UPDATE "profiles" SET "preferred_currency" = 'sek' WHERE "preferred_currency" = 'eur';
