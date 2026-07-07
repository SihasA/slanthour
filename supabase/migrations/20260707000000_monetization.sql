-- =====================================================================
-- Slanthour — Monetization groundwork (provider-agnostic)
-- Everything the paid tiers need except the payment provider itself:
-- tier expiry, a webhook idempotency ledger, first-party page-view
-- aggregates, Keepsake permanent-page grants, and the hi-fi variant flag.
-- See MONETIZATION_PLAN.md. No provider is wired up; all writes to these
-- tables happen through src/lib/billing/effects.ts with the service role.
-- =====================================================================

-- ─── Tier expiry ─────────────────────────────────────────────────────
-- Cancellation keeps the tier until the paid period ends; NULL = no
-- expiry (free tier, or a manually granted tier).

ALTER TABLE profiles ADD COLUMN tier_expires_at TIMESTAMPTZ;

-- ─── Billing event ledger ────────────────────────────────────────────
-- One row per provider webhook event, keyed by the provider's event id,
-- so redelivered webhooks are idempotent. Service-role only (no policies).

CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, event_id)
);

ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- ─── Page view aggregates ────────────────────────────────────────────
-- Cookie-less, aggregate-only analytics: one row per page per day.
-- Incremented from the published route via the RPC below (service role);
-- owners can read their own pages' rows.

CREATE TABLE page_view_daily (
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (page_id, day)
);

ALTER TABLE page_view_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read their pages' views"
  ON page_view_daily FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pages
    WHERE pages.id = page_view_daily.page_id AND pages.user_id = auth.uid()
  ));

CREATE OR REPLACE FUNCTION increment_page_view(p_page_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  INSERT INTO page_view_daily (page_id, day, views)
  VALUES (p_page_id, CURRENT_DATE, 1)
  ON CONFLICT (page_id, day) DO UPDATE SET views = page_view_daily.views + 1;
$$;

-- Only the service role may call it; the published route records views
-- server-side after visibility checks, so anon/authenticated grants stay off.
REVOKE EXECUTE ON FUNCTION increment_page_view(UUID) FROM PUBLIC, anon, authenticated;

-- ─── Keepsake permanent-page grants ──────────────────────────────────
-- One-time purchase attached to a single page: stays published for at
-- least `guaranteed_until`, exempt from page-count limits, no badge.
-- Grant rows survive unpublishing (the owner may republish freely) but
-- go with the page when the page is deleted by its owner.

CREATE TABLE permanent_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL UNIQUE REFERENCES pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  order_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  guaranteed_until TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_permanent_grants_user ON permanent_grants(user_id);

ALTER TABLE permanent_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read their grants"
  ON permanent_grants FOR SELECT USING (auth.uid() = user_id);

-- ─── High-fidelity variant flag ──────────────────────────────────────
-- Pro+ uploads also generate {dir}/xl.jpg (2560px); this marks assets
-- that have it so documents and cleanup know without probing storage.

ALTER TABLE media_assets ADD COLUMN has_xl BOOLEAN NOT NULL DEFAULT FALSE;
