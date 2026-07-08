-- Tier ladder v2: a hobby tier sits between free and pro.
-- Entitlements live in src/lib/entitlements.ts; the database only
-- constrains the set of valid tier values.

ALTER TABLE profiles DROP CONSTRAINT profiles_tier_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_tier_check
  CHECK (tier IN ('free', 'hobby', 'pro', 'studio'));
