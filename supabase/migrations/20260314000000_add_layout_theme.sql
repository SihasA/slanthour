-- =====================================================================
-- Add layout_theme to themes + character constraints on portfolios
-- =====================================================================

-- Layout theme column (editorial is the current legacy design)
ALTER TABLE themes
  ADD COLUMN layout_theme TEXT NOT NULL DEFAULT 'editorial'
  CHECK (layout_theme IN ('editorial', 'journal', 'cinematic'));

-- Enforce title/subtitle length limits
ALTER TABLE portfolios
  ADD CONSTRAINT portfolios_title_length CHECK (char_length(title) <= 25);

ALTER TABLE portfolios
  ADD CONSTRAINT portfolios_subtitle_length CHECK (char_length(subtitle) <= 90);
