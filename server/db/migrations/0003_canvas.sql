ALTER TABLE "images" ADD COLUMN "canvas" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "widgets" ADD COLUMN "edit_token" text;--> statement-breakpoint
ALTER TABLE "widgets" ADD COLUMN "scene" jsonb;--> statement-breakpoint
ALTER TABLE "widgets" ADD CONSTRAINT "widgets_editToken_unique" UNIQUE("edit_token");