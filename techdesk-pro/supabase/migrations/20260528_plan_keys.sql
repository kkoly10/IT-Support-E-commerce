-- Extend the plan_tier enum with the new per-user plan keys.
--
-- The original revision of this migration only did
--   ALTER COLUMN plan SET DEFAULT 'pending'
-- but organizations.plan is a Postgres ENUM (plan_tier) that only contained
-- the legacy keys (starter/growth/scale/custom). Without 'pending' (and the
-- other new keys) in the enum, every new signup fails at the DB layer
-- because app/api/signup/complete/route.js inserts plan='pending' explicitly,
-- and the admin client edit dropdown can't write founding/remote/managed/
-- secure either.
--
-- All five values are added with IF NOT EXISTS so this migration is safe
-- to re-apply. SET DEFAULT 'pending' is intentionally removed from this
-- file: combining ALTER TYPE ADD VALUE with a later ALTER COLUMN SET
-- DEFAULT that uses the new value in the same transaction is the kind of
-- thing that varies by Postgres version. The app passes plan='pending'
-- explicitly at signup, so the column-level default is a nice-to-have, not
-- a runtime requirement — wire it up later in its own migration if you want
-- it.

ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'founding';
ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'remote';
ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'managed';
ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'secure';
ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'custom';
