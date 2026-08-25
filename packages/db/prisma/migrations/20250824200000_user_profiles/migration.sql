-- CreateTable
CREATE TABLE "profiles" (
    "user_id" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "city" TEXT,
    "bio" TEXT,
    "preferred_currency" TEXT NOT NULL DEFAULT 'eur',
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id")
);

-- Backfill a profile row for every existing user
INSERT INTO "profiles" ("user_id", "preferred_currency", "marketing_opt_in", "created_at", "updated_at")
SELECT "id", 'eur', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users"
WHERE NOT EXISTS (
  SELECT 1 FROM "profiles" p WHERE p."user_id" = "users"."id"
);

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
