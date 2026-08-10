-- Illustration Collection series + First Partner sets (packages/shared/src/series-sets.ts)
DO $$ BEGIN ALTER TYPE "ProductSeries" ADD VALUE 'Illustration Collection'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "ProductSet" ADD VALUE 'First Partner series 2'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "ProductSet" ADD VALUE 'First Partner series 1'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
