-- AlterTable
ALTER TABLE "products" ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill from legacy single image column
UPDATE "products" SET "images" = ARRAY["image"] WHERE "image" IS NOT NULL AND cardinality("images") = 0;
