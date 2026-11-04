-- Refresh CardRarity / CardCondition to the shop's current option lists.
-- Legacy values are remapped so existing inventory stays readable; review
-- singles in admin afterward and set the exact rarity/condition.

CREATE TYPE "CardRarity_new" AS ENUM (
  'common',
  'uncommon',
  'rare',
  'double-rare',
  'ultra-rare',
  'illustration-rare',
  'special-illustration-rare',
  'hyper-rare',
  'promo'
);

ALTER TABLE "products"
  ALTER COLUMN "rarity" TYPE "CardRarity_new"
  USING (
    CASE "rarity"::text
      WHEN 'holo-rare' THEN 'rare'
      WHEN 'secret-rare' THEN 'hyper-rare'
      ELSE "rarity"::text
    END::"CardRarity_new"
  );

DROP TYPE "CardRarity";
ALTER TYPE "CardRarity_new" RENAME TO "CardRarity";

CREATE TYPE "CardCondition_new" AS ENUM (
  'mint',
  'near-mint',
  'excellent',
  'good',
  'light-played'
);

ALTER TABLE "products"
  ALTER COLUMN "condition" TYPE "CardCondition_new"
  USING (
    CASE "condition"::text
      WHEN 'lightly-played' THEN 'light-played'
      WHEN 'moderately-played' THEN 'good'
      ELSE "condition"::text
    END::"CardCondition_new"
  );

DROP TYPE "CardCondition";
ALTER TYPE "CardCondition_new" RENAME TO "CardCondition";
