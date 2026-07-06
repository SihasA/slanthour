// ─── Database row types ───────────────────────────────────────

import type { PageDocument, PublishedSnapshot } from "@/lib/page-document";

export type Tier = "free" | "pro" | "studio";
export type ThemeId = "monograph" | "roll36" | "keepsake" | "afterdark" | "cabinet";
export type Visibility = "public" | "unlisted" | "password";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  email_public: string | null;
  instagram_handle: string | null;
  website_url: string | null;
  avatar_url: string | null;
  tier: Tier;
  username_changed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  theme: ThemeId;
  theme_settings: Record<string, unknown>;
  draft: PageDocument;
  draft_rev: number;
  published: PublishedSnapshot | null;
  published_at: string | null;
  is_published: boolean;
  visibility: Visibility;
  password_hash: string | null;
  cover_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  user_id: string;
  storage_path: string;
  has_variants: boolean;
  filename: string;
  width: number | null;
  height: number | null;
  blur_data_url: string | null;
  size_bytes: number | null;
  created_at: string;
}
