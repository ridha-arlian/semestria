-- Opaque ids for URLs. Integer primary keys stay internal, so routes no longer
-- expose sequential ids and workspace names. Existing rows get a random value;
-- new rows are filled by Prisma's cuid(2) default.
ALTER TABLE "workspaces" ADD COLUMN "publicId" TEXT;
ALTER TABLE "tasks" ADD COLUMN "publicId" TEXT;
ALTER TABLE "materials" ADD COLUMN "publicId" TEXT;

UPDATE "workspaces" SET "publicId" = replace(gen_random_uuid()::text, '-', '');
UPDATE "tasks" SET "publicId" = replace(gen_random_uuid()::text, '-', '');
UPDATE "materials" SET "publicId" = replace(gen_random_uuid()::text, '-', '');

ALTER TABLE "workspaces" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "tasks" ALTER COLUMN "publicId" SET NOT NULL;
ALTER TABLE "materials" ALTER COLUMN "publicId" SET NOT NULL;

CREATE UNIQUE INDEX "workspaces_publicId_key" ON "workspaces"("publicId");
CREATE UNIQUE INDEX "tasks_publicId_key" ON "tasks"("publicId");
CREATE UNIQUE INDEX "materials_publicId_key" ON "materials"("publicId");
