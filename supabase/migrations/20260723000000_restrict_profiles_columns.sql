-- =====================================================================
-- Slanthour — Close the public profile info-leak (SECURITY)
-- The profiles RLS policy is `FOR SELECT USING (true)` so every row is
-- world-readable, and the anon key ships in the client bundle. That let
-- anyone dump every user's billing status by querying
--   /rest/v1/profiles?select=username,tier,tier_expires_at
-- i.e. enumerate exactly who is a paying customer and when they lapse.
--
-- Postgres RLS is row-level, not column-level, so we cannot hide columns
-- through a policy. We use column privileges instead: revoke the blanket
-- table SELECT from the public `anon` role and re-grant only the columns a
-- public profile page actually renders. The billing/private columns
-- (tier, tier_expires_at, username_changed_at) are withheld from anon.
--
-- `authenticated` keeps full table SELECT so a signed-in user's own-tier
-- reads (entitlements) via the user client keep working unchanged, and
-- server code using the service role is unaffected (it bypasses grants).
-- The public profile route was narrowed to an explicit safe-column select
-- in the same change, so no anon query touches a withheld column.
--
-- Residual (documented, lower severity): an *authenticated* user can still
-- read other users' tiers via PostgREST. Fully closing that needs own-tier
-- reads routed through a SECURITY DEFINER RPC; tracked as a follow-up so it
-- can ship without risking a paid-gating regression.
-- =====================================================================

REVOKE SELECT ON public.profiles FROM anon;

GRANT SELECT (
  id,
  username,
  display_name,
  bio,
  email_public,
  instagram_handle,
  website_url,
  avatar_url,
  created_at,
  updated_at
) ON public.profiles TO anon;
