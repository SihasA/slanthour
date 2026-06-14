-- =====================================================================
-- Arbor AI — private context library
-- Tables for collections, files (inline markdown + uploaded pdf/image),
-- tags, and a private storage bucket. Access is via the service role
-- only (gated by a shared password at the Next.js layer), so RLS is
-- enabled with no public policies — denying all anon/authenticated reads.
-- =====================================================================

-- ─── Tables ──────────────────────────────────────────────────────────

CREATE TABLE arbor_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE arbor_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES arbor_collections(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('markdown', 'pdf', 'image')),
  title TEXT NOT NULL,
  filename TEXT,
  content TEXT,            -- inline markdown body (kind = 'markdown')
  storage_path TEXT,       -- object path in the 'arbor' bucket (pdf/image)
  mime_type TEXT,
  size_bytes BIGINT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE arbor_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE arbor_file_tags (
  file_id UUID REFERENCES arbor_files(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES arbor_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (file_id, tag_id)
);


-- ─── Indexes ─────────────────────────────────────────────────────────

CREATE INDEX idx_arbor_files_collection ON arbor_files(collection_id);
CREATE INDEX idx_arbor_files_kind ON arbor_files(kind);
CREATE INDEX idx_arbor_files_sort ON arbor_files(collection_id, sort_order);
CREATE INDEX idx_arbor_file_tags_tag ON arbor_file_tags(tag_id);


-- ─── Row-Level Security ──────────────────────────────────────────────
-- Enable RLS with no policies: anon + authenticated roles are denied all
-- access. The app reaches this data exclusively through the service role
-- (which bypasses RLS) from server routes behind the shared-password gate.

ALTER TABLE arbor_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbor_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbor_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbor_file_tags ENABLE ROW LEVEL SECURITY;


-- ─── Storage ─────────────────────────────────────────────────────────
-- Private bucket. No storage policies → only the service role can read or
-- write objects; files are streamed to the client through a gated route.

INSERT INTO storage.buckets (id, name, public)
VALUES ('arbor', 'arbor', false)
ON CONFLICT (id) DO NOTHING;
