-- =====================================================================
-- Slanthour — Watermarking (MONETIZATION_PLAN.md §3.9)
-- Uploads also generate {lg,md,sm,xl}.wm.jpg siblings with the owner's
-- name baked in client-side, alongside the existing clean variants; this
-- flags assets that have them so documents/cleanup know without probing
-- storage. The per-page on/off toggle lives in the page document JSONB
-- (PageDisplaySettings.watermark), so no column is needed for it.
-- =====================================================================

ALTER TABLE media_assets ADD COLUMN has_watermark BOOLEAN NOT NULL DEFAULT FALSE;
