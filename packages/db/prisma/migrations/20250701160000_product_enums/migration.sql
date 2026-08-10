-- Product taxonomy enums (values match packages/shared/src/enums.ts)
-- Sanitises legacy free-text rows before casting columns to enums.

DO $$ BEGIN
  CREATE TYPE "ProductCategory" AS ENUM (
    'booster-box',
    'elite-trainer-box',
    'booster-pack',
    'single-card',
    'bundle',
    'accessory'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProductSeries" AS ENUM (
    'Scarlet & Violet',
    'Sword & Shield',
    'akkNERDS Exclusive',
    'Protection'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProductSet" AS ENUM (
    '151',
    'Obsidian Flames',
    'Paldea Evolved',
    'Temporal Forces',
    'Lost Origin',
    'Paradox Rift',
    'Twilight Masquerade',
    'Scarlet & Violet Base',
    'Mixed',
    'Accessories'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CardRarity" AS ENUM (
    'common',
    'uncommon',
    'rare',
    'holo-rare',
    'ultra-rare',
    'secret-rare',
    'illustration-rare'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CardCondition" AS ENUM (
    'mint',
    'near-mint',
    'lightly-played',
    'moderately-played'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Normalise legacy free-text values created before enums existed.
UPDATE "products"
SET "category" = 'single-card'
WHERE "category" NOT IN (
  'booster-box',
  'elite-trainer-box',
  'booster-pack',
  'single-card',
  'bundle',
  'accessory'
);

UPDATE "products"
SET "series" = 'Scarlet & Violet'
WHERE "series" NOT IN (
  'Scarlet & Violet',
  'Sword & Shield',
  'akkNERDS Exclusive',
  'Protection'
);

UPDATE "products"
SET "set_name" = 'Mixed'
WHERE "set_name" NOT IN (
  '151',
  'Obsidian Flames',
  'Paldea Evolved',
  'Temporal Forces',
  'Lost Origin',
  'Paradox Rift',
  'Twilight Masquerade',
  'Scarlet & Violet Base',
  'Mixed',
  'Accessories'
);

UPDATE "products"
SET "rarity" = NULL
WHERE "rarity" IS NOT NULL
  AND "rarity" NOT IN (
    'common',
    'uncommon',
    'rare',
    'holo-rare',
    'ultra-rare',
    'secret-rare',
    'illustration-rare'
  );

UPDATE "products"
SET "condition" = NULL
WHERE "condition" IS NOT NULL
  AND "condition" NOT IN (
    'mint',
    'near-mint',
    'lightly-played',
    'moderately-played'
  );

-- Cast columns only when still text (safe to re-run after a failed attempt).
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'category'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE "products"
      ALTER COLUMN "category" TYPE "ProductCategory" USING ("category"::"ProductCategory"),
      ALTER COLUMN "series" TYPE "ProductSeries" USING ("series"::"ProductSeries"),
      ALTER COLUMN "set_name" TYPE "ProductSet" USING ("set_name"::"ProductSet"),
      ALTER COLUMN "rarity" TYPE "CardRarity" USING (
        CASE WHEN "rarity" IS NULL THEN NULL ELSE "rarity"::"CardRarity" END
      ),
      ALTER COLUMN "condition" TYPE "CardCondition" USING (
        CASE WHEN "condition" IS NULL THEN NULL ELSE "condition"::"CardCondition" END
      );
  END IF;
END $$;
