-- Product print language

CREATE TYPE "ProductLanguage" AS ENUM ('english', 'japanese', 'chinese');

ALTER TABLE "products"
  ADD COLUMN "language" "ProductLanguage" NOT NULL DEFAULT 'english';
