-- =====================================================================
-- Slanthour — Pages platform
-- Multi-page model: pages (versioned JSONB documents, draft/published
-- snapshots, visibility) + media_assets. Strictly additive: legacy
-- portfolio-era tables (portfolios/photos/themes) are kept and their
-- data is backfilled into the new model. Arbor tables are untouched.
-- =====================================================================

-- ─── Tables ──────────────────────────────────────────────────────────

CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$' AND char_length(slug) <= 60),
  title TEXT NOT NULL DEFAULT 'Untitled' CHECK (char_length(title) <= 120),
  theme TEXT NOT NULL DEFAULT 'monograph'
    CHECK (theme IN ('monograph', 'roll36', 'keepsake', 'afterdark', 'cabinet')),
  theme_settings JSONB NOT NULL DEFAULT '{}',
  -- Working copy of the versioned page document ({"version":1,"sections":[...]})
  draft JSONB NOT NULL DEFAULT '{"version": 1, "sections": []}',
  -- Optimistic-concurrency revision; autosave must present the current rev
  draft_rev INTEGER NOT NULL DEFAULT 0,
  -- Frozen, self-contained snapshot written on publish (document + theme +
  -- settings + title). Public rendering reads ONLY this column.
  published JSONB,
  published_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'unlisted', 'password')),
  -- PBKDF2 hash ("pbkdf2$<iterations>$<salt>$<hash>"); never the raw password
  password_hash TEXT,
  -- Storage path of the cover image (dashboard/profile cards)
  cover_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

CREATE INDEX idx_pages_user ON pages(user_id);
CREATE INDEX idx_pages_public_profile ON pages(user_id, is_published, visibility);

-- Bookkeeping for uploaded images (quota + deletion). Rendering never joins
-- this table: page documents embed path/width/height/blur at insert time.
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Path of the large variant inside the 'portfolios' bucket.
  -- New uploads: {userId}/m/{assetId}/lg.jpg (+ md.jpg / sm.jpg variants).
  -- Backfilled legacy photos keep their original single-file path.
  storage_path TEXT NOT NULL,
  has_variants BOOLEAN NOT NULL DEFAULT FALSE,
  filename TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  blur_data_url TEXT,
  size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_assets_user ON media_assets(user_id);

-- ─── updated_at maintenance ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_pages_updated_at()
RETURNS TRIGGER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER pages_set_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION set_pages_updated_at();

-- ─── Row-Level Security ──────────────────────────────────────────────
-- Anonymous SELECT is limited to published PUBLIC pages. Unlisted and
-- password-protected pages are deliberately NOT anon-readable (prevents
-- enumeration via the REST API); the public routes fetch them server-side
-- with the service-role client after applying visibility rules in code.

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published public pages are viewable"
  ON pages FOR SELECT
  USING ((is_published = true AND visibility = 'public') OR auth.uid() = user_id);

CREATE POLICY "Users can insert own pages"
  ON pages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pages"
  ON pages FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pages"
  ON pages FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own media"
  ON media_assets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media"
  ON media_assets FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media"
  ON media_assets FOR DELETE USING (auth.uid() = user_id);

-- ─── Signup trigger: stop provisioning legacy portfolio rows ─────────
-- New users get a profile only; pages are created explicitly from the app.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  base_username := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9-]', '-', 'g'));
  base_username := REGEXP_REPLACE(base_username, '-+', '-', 'g');
  base_username := TRIM(BOTH '-' FROM base_username);

  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  final_username := base_username;

  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || '-' || counter;
  END LOOP;

  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', final_username)
  );

  RETURN NEW;
END;
$$;

-- ─── Backfill: legacy portfolios → pages ─────────────────────────────
-- Each legacy portfolio becomes a page at slug 'portfolio' (Monograph theme)
-- with a hero (banner), a heading, and a grid of the portfolio's photos.
-- Legacy photos also get media_assets rows (same id, original single-file
-- path) so deletion accounting covers them. Legacy tables are NOT dropped.

-- 1) media_assets from legacy photos
INSERT INTO media_assets (id, user_id, storage_path, has_variants, filename, width, height, created_at)
SELECT ph.id, po.user_id, ph.storage_path, FALSE, ph.filename, ph.width, ph.height, ph.created_at
FROM photos ph
JOIN portfolios po ON po.id = ph.portfolio_id
WHERE po.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 2) pages from legacy portfolios
WITH photo_docs AS (
  SELECT
    ph.portfolio_id,
    jsonb_agg(
      jsonb_build_object(
        'id', ph.id::text,
        'assetId', ph.id::text,
        'path', ph.storage_path,
        'width', ph.width,
        'height', ph.height,
        'alt', COALESCE(ph.caption, ''),
        'caption', COALESCE(ph.caption, ''),
        'blur', NULL
      ) ORDER BY ph.sort_order
    ) AS images,
    (ARRAY_AGG(ph.storage_path ORDER BY ph.sort_order))[1] AS first_photo_path
  FROM photos ph
  GROUP BY ph.portfolio_id
),
docs AS (
  SELECT
    po.id AS portfolio_id,
    po.user_id,
    po.is_published,
    po.updated_at,
    po.created_at,
    LEFT(TRIM(po.title || COALESCE(' ' || po.title_line2, '')), 120) AS page_title,
    jsonb_build_object(
      'version', 1,
      'sections',
      -- hero (only when a banner exists) + heading + photo grid
      COALESCE(
        CASE WHEN po.banner_url IS NOT NULL THEN
          jsonb_build_array(jsonb_build_object(
            'id', 'hero-' || po.id::text,
            'type', 'hero',
            'title', LEFT(TRIM(po.title || COALESCE(' ' || po.title_line2, '')), 120),
            'subtitle', COALESCE(po.subtitle, ''),
            'height', 'half',
            'image', jsonb_build_object(
              'id', 'banner-' || po.id::text,
              'assetId', NULL,
              'path', REGEXP_REPLACE(po.banner_url, '^.*/object/public/portfolios/', ''),
              'width', NULL, 'height', NULL,
              'alt', '', 'caption', '', 'blur', NULL
            )
          ))
        ELSE
          jsonb_build_array(jsonb_build_object(
            'id', 'heading-' || po.id::text,
            'type', 'heading',
            'level', 1,
            'title', LEFT(TRIM(po.title || COALESCE(' ' || po.title_line2, '')), 120),
            'subtitle', COALESCE(po.subtitle, '')
          ))
        END, '[]'::jsonb)
      || COALESCE(
        (SELECT jsonb_build_array(jsonb_build_object(
            'id', 'grid-' || po.id::text,
            'type', 'grid',
            'columns', 3,
            'gap', 'regular',
            'images', pd.images
          ))
         FROM photo_docs pd WHERE pd.portfolio_id = po.id),
        '[]'::jsonb)
    ) AS doc,
    (SELECT pd.first_photo_path FROM photo_docs pd WHERE pd.portfolio_id = po.id) AS cover_path
  FROM portfolios po
  WHERE po.user_id IS NOT NULL
)
INSERT INTO pages (user_id, slug, title, theme, draft, published, published_at,
                   is_published, visibility, cover_path, created_at, updated_at)
SELECT
  d.user_id,
  'portfolio',
  COALESCE(NULLIF(d.page_title, ''), 'Untitled'),
  'monograph',
  d.doc,
  CASE WHEN d.is_published THEN
    jsonb_build_object(
      'snapshotVersion', 1,
      'document', d.doc,
      'theme', 'monograph',
      'themeSettings', '{}'::jsonb,
      'title', COALESCE(NULLIF(d.page_title, ''), 'Untitled'),
      'publishedAt', TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  ELSE NULL END,
  CASE WHEN d.is_published THEN NOW() ELSE NULL END,
  d.is_published,
  'public',
  d.cover_path,
  d.created_at,
  d.updated_at
FROM docs d
-- Skip provisioned-but-untouched legacy portfolios (no photos, no banner,
-- default title, never published): they carry no user content.
WHERE d.is_published
   OR d.cover_path IS NOT NULL
   OR d.doc->'sections'->0->>'type' = 'hero'
   OR COALESCE(NULLIF(d.page_title, ''), 'Untitled')
        NOT IN ('Untitled', 'Untitled Portfolio')
ON CONFLICT (user_id, slug) DO NOTHING;
