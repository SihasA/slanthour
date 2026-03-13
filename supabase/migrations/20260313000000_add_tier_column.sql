-- Add tier column to profiles for pricing tier awareness
-- free: 18 photos, pro: 48 photos, studio: 240 photos
ALTER TABLE profiles ADD COLUMN tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'studio'));
