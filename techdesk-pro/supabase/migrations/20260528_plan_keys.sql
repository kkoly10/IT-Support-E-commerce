-- Set the default for organizations.plan to 'pending'.
--
-- After the per-user plan model shipped, app/signup/page.js now passes
-- plan='pending' explicitly so the admin can set the real plan
-- (founding / remote / managed / secure / custom) after the fit
-- review. This migration changes the column default to match, so any
-- future insert path that does not pass plan explicitly still does the
-- right thing instead of silently landing as a legacy 'starter'.
--
-- A CHECK constraint enumerating valid plan values is intentionally
-- not added here. The live DB may contain values outside the catalog
-- (manual overrides, prior data hygiene) that would break the
-- migration. Tighten typing in a follow-up after a separate audit of
-- existing plan values.
--
-- Idempotent: ALTER COLUMN SET DEFAULT can run more than once safely.

alter table public.organizations
  alter column plan set default 'pending';
