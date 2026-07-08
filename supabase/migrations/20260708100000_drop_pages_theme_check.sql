-- Drop the hardcoded theme allowlist on pages.theme.
--
-- The old CHECK listed the original five theme ids and silently broke draft
-- saves for every theme added since (Riviera, Klaxon, Verdigris): switching
-- to one made every save of that page fail with "Could not save changes".
-- Theme validity is already enforced where it belongs: savePageDraft accepts
-- only registry ids (isThemeId) and getTheme falls back to the default theme
-- for anything unknown at render. Dropping the constraint instead of widening
-- it so theme nine doesn't repeat this failure.

ALTER TABLE pages DROP CONSTRAINT pages_theme_check;
