-- =====================================================================
-- Slanthour — Proofing galleries (MONETIZATION_PLAN.md §3.7)
-- The client-selects-their-favourites workflow. A proofing gallery is
-- its own object, not a page: link + optional password access, no client
-- accounts. Galleries serve sm/md variants only; the photographer's
-- deliverable is the select list (original filenames).
--
-- Access model mirrors password pages: rows are NOT anon-readable
-- (prevents enumeration); the public /proof route reads server-side with
-- the service-role client after applying the gate in code. Anonymous
-- selection writes also go through a gated route handler (service role).
-- =====================================================================

-- ─── Galleries ───────────────────────────────────────────────────────
-- status: 'active' counts against the tier limit and is reachable at
-- /proof/{slug}; 'archived' keeps the data but closes the link.

CREATE TABLE proofing_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  -- Unguessable share token (the link IS the credential when no password
  -- is set), generated server-side; never derived from user input.
  slug TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proofing_galleries_user ON proofing_galleries(user_id, status);

CREATE TRIGGER proofing_galleries_set_updated_at
  BEFORE UPDATE ON proofing_galleries
  FOR EACH ROW EXECUTE FUNCTION set_pages_updated_at();

ALTER TABLE proofing_galleries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their galleries"
  ON proofing_galleries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Images ──────────────────────────────────────────────────────────
-- storage_path points at the md variant ({userId}/p/{galleryId}/{imageId}/md.jpg);
-- sm.jpg sits alongside. No lg/xl is ever generated for proofing (§3.7
-- economics: ~100KB/photo). filename keeps the client's original name —
-- it is the deliverable that pastes into Lightroom.

CREATE TABLE proofing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES proofing_galleries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proofing_images_gallery ON proofing_images(gallery_id, position);

ALTER TABLE proofing_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their gallery images"
  ON proofing_images FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Selections ──────────────────────────────────────────────────────
-- One shared selection set per gallery (no client accounts): a row's
-- existence means the photo is selected. Written only by the service
-- role via the gated /api/proof route; owners read (and may clear) them.

CREATE TABLE proofing_selections (
  image_id UUID PRIMARY KEY REFERENCES proofing_images(id) ON DELETE CASCADE,
  gallery_id UUID NOT NULL REFERENCES proofing_galleries(id) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proofing_selections_gallery ON proofing_selections(gallery_id);

ALTER TABLE proofing_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their galleries' selections"
  ON proofing_selections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proofing_galleries g
    WHERE g.id = proofing_selections.gallery_id AND g.user_id = auth.uid()
  ));

CREATE POLICY "Owners clear their galleries' selections"
  ON proofing_selections FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM proofing_galleries g
    WHERE g.id = proofing_selections.gallery_id AND g.user_id = auth.uid()
  ));
