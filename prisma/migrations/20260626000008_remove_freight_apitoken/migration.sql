-- Remove dead apiToken column from FreightConfig (#23)
ALTER TABLE "FreightConfig" DROP COLUMN IF EXISTS "apiToken";
