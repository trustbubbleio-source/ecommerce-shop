-- Mega Evolution — Delta Reign (release Nov 6, 2026)
DO $$ BEGIN ALTER TYPE "ProductSet" ADD VALUE 'Delta Reign'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
