-- Demo accounts are disposable users seeded on demand.
ALTER TABLE "users"
  ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "demoIpHash" TEXT;

CREATE INDEX "users_isDemo_createdAt_idx" ON "users"("isDemo", "createdAt");
CREATE INDEX "users_demoIpHash_createdAt_idx" ON "users"("demoIpHash", "createdAt");
