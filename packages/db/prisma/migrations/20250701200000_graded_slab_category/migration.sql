-- Graded slab product category (packages/shared/src/enums.ts)
DO $$ BEGIN ALTER TYPE "ProductCategory" ADD VALUE 'graded-slab'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
