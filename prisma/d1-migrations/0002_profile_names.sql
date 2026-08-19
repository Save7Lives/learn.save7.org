-- Migration 0002: separate first name and surname, and let learners edit them.
--
-- The User table stored one `name`, captured once at signup and never editable.
-- That is a problem specific to this product: the name a learner types at signup
-- is the name printed on their certificate, and people mistype their own names.
-- A certificate with a misspelt name is worthless to the person who earned it.
--
-- `name` is kept as the composed full name, because certificates, the admin
-- dashboards and the session all read it, and a certificate needs one string.

ALTER TABLE "User" ADD COLUMN "firstName" TEXT;

ALTER TABLE "User" ADD COLUMN "lastName" TEXT;

-- Backfill existing accounts by splitting on the FIRST space, not the last.
-- South African surnames are frequently multi-word — "van der Merwe", "du Plessis",
-- "Ntuli ka Mthembu" — so treating everything after the first token as the surname
-- is the better guess. Where it guesses wrong, the learner can now fix it, which
-- was the point of the migration.
UPDATE "User"
SET "firstName" = CASE
      WHEN instr(trim("name"), ' ') > 0
        THEN substr(trim("name"), 1, instr(trim("name"), ' ') - 1)
      ELSE trim("name")
    END,
    "lastName" = CASE
      WHEN instr(trim("name"), ' ') > 0
        THEN trim(substr(trim("name"), instr(trim("name"), ' ') + 1))
      ELSE NULL
    END
WHERE "firstName" IS NULL;
