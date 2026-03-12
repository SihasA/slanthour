-- =====================================================================
-- Slant Hour — Initial Schema
-- Phase 1: tables, indexes, RLS policies, triggers, storage bucket
-- =====================================================================

-- ─── Tables ──────────────────────────────────────────────────────────

-- Profiles: extends Supabase auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  email_public TEXT,
  instagram_handle TEXT,
  website_url TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Theme settings per user
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'dark' CHECK (mode IN ('light', 'dark')),
  font_heading TEXT NOT NULL DEFAULT 'Cormorant Garamond',
  font_body TEXT NOT NULL DEFAULT 'DM Mono',
  color_background TEXT NOT NULL DEFAULT '#0f0e0d',
  color_text TEXT NOT NULL DEFAULT '#f7f5f2',
  color_accent TEXT NOT NULL DEFAULT '#9c8e7a',
  UNIQUE(user_id)
);

-- Portfolios: one per user for MVP
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  subtitle TEXT,
  banner_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Photos: individual images within a portfolio
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Beta waitlist
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  instagram_handle TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ─── Indexes ─────────────────────────────────────────────────────────

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_photos_portfolio ON photos(portfolio_id);
CREATE INDEX idx_photos_sort ON photos(portfolio_id, sort_order);
CREATE INDEX idx_waitlist_status ON waitlist(status);


-- ─── Row-Level Security ──────────────────────────────────────────────

-- Profiles: public read, owner write
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Themes: public read (needed to render portfolio), owner write
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Themes are viewable by everyone"
  ON themes FOR SELECT USING (true);

CREATE POLICY "Users can insert own theme"
  ON themes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own theme"
  ON themes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own theme"
  ON themes FOR DELETE USING (auth.uid() = user_id);

-- Portfolios: published ones public, owner full access
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published portfolios are viewable"
  ON portfolios FOR SELECT USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio"
  ON portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio"
  ON portfolios FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio"
  ON portfolios FOR DELETE USING (auth.uid() = user_id);

-- Photos: viewable if portfolio is published, owner full access
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos viewable if portfolio published"
  ON photos FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = photos.portfolio_id
      AND (portfolios.is_published = true OR portfolios.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own photos"
  ON photos FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = photos.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own photos"
  ON photos FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = photos.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own photos"
  ON photos FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = photos.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

-- Waitlist: insert only (no auth needed), admin reads via service role
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON waitlist FOR INSERT WITH CHECK (true);


-- ─── Auto-provision on signup ────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate username from email (before @, lowercase, alphanumeric + hyphens only)
  base_username := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9-]', '-', 'g'));
  -- Remove leading/trailing/double hyphens
  base_username := REGEXP_REPLACE(base_username, '-+', '-', 'g');
  base_username := TRIM(BOTH '-' FROM base_username);

  -- Fallback if empty
  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  final_username := base_username;

  -- Handle collisions by appending numbers
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || '-' || counter;
  END LOOP;

  -- Create profile
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', final_username)
  );

  -- Create default theme
  INSERT INTO themes (user_id)
  VALUES (NEW.id);

  -- Create empty portfolio
  INSERT INTO portfolios (user_id, title)
  VALUES (NEW.id, 'Untitled Portfolio');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─── Storage ─────────────────────────────────────────────────────────

-- Create the portfolios storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolios', 'portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access to all files in the bucket
CREATE POLICY "Public portfolio images are viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolios');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolios'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own files
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'portfolios'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portfolios'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
