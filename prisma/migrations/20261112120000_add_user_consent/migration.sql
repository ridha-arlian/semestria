-- Record which Terms/Privacy version a user accepted, and when.
ALTER TABLE "users"
  ADD COLUMN "termsVersion" TEXT,
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
