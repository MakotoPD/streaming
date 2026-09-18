ALTER TABLE "users" ADD COLUMN "panel_token" text;
UPDATE "users" SET "panel_token" = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') WHERE "panel_token" IS NULL;
ALTER TABLE "users" ALTER COLUMN "panel_token" SET NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_panelToken_unique" UNIQUE("panel_token");
