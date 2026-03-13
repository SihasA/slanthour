// ─── Database row types ───────────────────────────────────────

export type Tier = "free" | "pro" | "studio";

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
  created_at: string;
  updated_at: string;
}

export interface Theme {
  id: string;
  user_id: string;
  mode: "light" | "dark";
  font_heading: string;
  font_body: string;
  color_background: string;
  color_text: string;
  color_accent: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  title: string;
  subtitle: string | null;
  banner_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  portfolio_id: string;
  storage_path: string;
  filename: string;
  caption: string | null;
  sort_order: number;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  instagram_handle: string | null;
  message: string | null;
  status: "pending" | "invited" | "declined";
  created_at: string;
}

// ─── Form types ───────────────────────────────────────────────

export interface WaitlistFormData {
  name: string;
  email: string;
  instagram_handle: string;
  message: string;
}
