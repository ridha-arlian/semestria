-- Users may rename themselves; a later Google sign-in must not revert it.
ALTER TABLE "users" ADD COLUMN     "nameCustomized" BOOLEAN NOT NULL DEFAULT false;
