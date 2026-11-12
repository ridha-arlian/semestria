-- Consent is no longer collected: signing in implies acceptance.
-- All stored values were null, so this drops the columns outright.
ALTER TABLE "users"
  DROP COLUMN "termsVersion",
  DROP COLUMN "termsAcceptedAt";
