# Phase 5 Handover — Slant Hour

## Project Context

Slant Hour is a curated portfolio platform for photographers. Users sign up (Google OAuth), upload photos, pick a theme, and publish at `slanthour.com/{username}`.

**Tech stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Supabase (auth + DB + storage), DnD Kit (drag reorder), Vercel deployment.

**Current state:** Authentication works (Google OAuth), photo upload/reorder works, three locked themes work end-to-end, accent color customization works. The site is live at slanthour.com.

---

## Tier Model & Pricing

```
FREE:   Editorial only, 18 photos, banner, accent color, 1 username (1 change/month)
PRO:    All themes (Editorial + Journal + Cinematic + future), 48 photos, all free features
        Price: £6.99/month
```

Free users get a clean, functional portfolio. Pro unlocks layout variety and capacity. Studio tier (240 photos) exists in schema but is not part of the initial launch.

**Key enforcement points:**
- ThemePicker must gate Journal/Cinematic behind pro tier
- Photo upload must enforce tier photo limits (already exists in constants.ts TIER_LIMITS)
- Username changes must be tracked and limited (1/month for free, TBD for pro)

---

## File Structure (key files only)

```
src/
├── app/
│   ├── layout.tsx                    # Root layout, Google Fonts loaded here
│   ├── page.tsx                      # Landing page (/)
│   ├── login/page.tsx                # Google OAuth + email/password login
│   ├── [username]/page.tsx           # Public portfolio — routes to layout component
│   ├── dashboard/
│   │   ├── layout.tsx                # Sidebar wrapper (auth-gated)
│   │   ├── page.tsx                  # Dashboard home
│   │   ├── portfolio/page.tsx        # Photo upload, reorder, banner upload
│   │   └── settings/page.tsx         # Profile form + theme picker + accent color
│   └── api/
│       ├── auth/callback/route.ts    # OAuth code → session exchange
│       ├── photos/reorder/route.ts   # PATCH photo sort_order
│       └── waitlist/route.ts         # POST waitlist entry
│
├── components/
│   ├── dashboard/
│   │   ├── BannerUpload.tsx          # Upload-only, no crop/position
│   │   ├── PhotoCard.tsx             # Single photo with delete/caption
│   │   ├── PhotoGrid.tsx             # DnD sortable grid
│   │   ├── PhotoUploader.tsx         # File input + compression
│   │   ├── PortfolioSettings.tsx     # Title (25 char), subtitle (90 char), publish toggle
│   │   ├── ProfileForm.tsx           # Display name, bio, socials
│   │   ├── Sidebar.tsx               # Dashboard nav
│   │   ├── SignOutButton.tsx
│   │   ├── ThemeForm.tsx             # Accent color picker (6 presets + custom)
│   │   ├── ThemePicker.tsx           # 3 theme cards with confirm dialog
│   │   └── ThemeSettings.tsx         # Orchestrates ThemePicker + ThemeForm
│   ├── portfolio/
│   │   ├── CopyProtection.tsx        # Disable right-click on images
│   │   ├── Lightbox.tsx              # Fullscreen viewer, keyboard + swipe nav
│   │   ├── ThemeHeader.tsx           # Fixed header, variant-aware (editorial/journal/cinematic)
│   │   └── themes/
│   │       ├── EditorialLayout.tsx   # Dark, 3-col square grid, 75vh banner
│   │       ├── JournalLayout.tsx     # Light, 2-col staggered portraits, visible captions
│   │       └── CinematicLayout.tsx   # Dark, 100vh hero, full-bleed sequence
│   └── landing/
│       └── WaitlistForm.tsx
│
├── lib/
│   ├── constants.ts                  # LAYOUT_THEMES, ACCENT_PRESETS, TIER_LIMITS, constraints
│   ├── theme.ts                      # getLockedTheme(), buildThemeVars(), getFontCss()
│   ├── image.ts                      # compressImage(), generateStoragePath/BannerPath()
│   └── supabase/
│       ├── client.ts                 # Browser Supabase client
│       └── server.ts                 # Server Supabase client (cookies)
│
├── types/index.ts                    # Profile, Theme, Portfolio, Photo, LayoutTheme, Tier
├── middleware.ts                     # Auth guard, OAuth code forwarding from / to /api/auth/callback
└── globals.css

supabase/migrations/
├── 20260312000000_initial_schema.sql       # profiles, themes, portfolios, photos, waitlist + RLS
├── 20260312000001_fix_trigger_permissions.sql
├── 20260313000000_add_tier_column.sql      # tier column on profiles
└── 20260314000000_add_layout_theme.sql     # layout_theme column on themes
```

---

## Database Schema (Supabase)

**profiles** — id (FK auth.users), username (unique), display_name, bio, email_public, instagram_handle, website_url, tier (free/pro/studio)

**themes** — id, user_id (FK), layout_theme (editorial/journal/cinematic), mode, color_accent, color_background, color_text, font_heading, font_body

**portfolios** — id, user_id, title (max 25), subtitle (max 90), banner_url, is_published

**photos** — id, portfolio_id, storage_path, caption, sort_order, width, height

**waitlist** — id, email (unique), name, instagram_handle, message, status

---

## Theme System (Locked)

Each theme locks: layout, mode (light/dark), fonts, and all colors. Only `color_accent` is customizable.

```
Editorial:  dark,  Cormorant Garamond / DM Mono,     #0a0908 bg  (FREE)
Journal:    light, Libre Baskerville / Inter,         #f4f0ea bg  (PRO)
Cinematic:  dark,  Space Grotesk / IBM Plex Mono,     #0e1010 bg  (PRO)
```

`getLockedTheme(layoutTheme, userAccent?)` in `src/lib/theme.ts` is the single source of truth.

---

## What Works

- Google OAuth login (with code-forwarding fallback in middleware)
- Email/password signup and login
- Profile editing (name, bio, socials)
- Portfolio settings (title, subtitle, publish toggle)
- Photo upload with client-side compression (max 2000px)
- Photo drag-and-drop reordering
- Banner upload (upload + remove, no crop/position)
- Theme selection with confirmation dialog + visual feedback
- Accent color picker (6 presets + custom hex)
- Three distinct public portfolio layouts
- Lightbox with keyboard + swipe navigation
- Copy protection (right-click disabled on images)
- Responsive layouts (mobile breakpoints at 768px)
- Production build passes, deployed on Vercel

---

## Phase 5 Tasks

### 1. Banner Crop & Position Editor

**Current state:** BannerUpload.tsx is upload-only. The image is stored at full resolution and rendered with `object-fit: cover; object-position: center 40%` (hardcoded in EditorialLayout). Users cannot adjust crop or position.

**What needs to happen:**
- Replace the simple upload preview (line 125-140 of BannerUpload.tsx) with an interactive crop/position tool
- User should see the full image zoomed out with a viewfinder overlay showing the visible area
- Controls: zoom slider (or pinch on mobile) + drag to reposition
- Store crop metadata in the `portfolios` table: `banner_crop: { zoom: number, x: number, y: number }` (new column needed via migration)
- Editorial uses full-bleed 75vh banner — the viewfinder should reflect this aspect ratio
- On the public portfolio, apply the crop via `object-position` and `transform: scale()` from the stored metadata

**DB migration needed:**
```sql
ALTER TABLE portfolios ADD COLUMN banner_crop JSONB DEFAULT '{"zoom": 1, "x": 50, "y": 40}';
```

**Files to modify:**
- `src/components/dashboard/BannerUpload.tsx` — add crop UI
- `src/types/index.ts` — add `banner_crop` to Portfolio type
- `src/app/[username]/page.tsx` — pass crop data to layouts
- All three layout files — apply crop metadata to banner rendering
- New migration file

**Recommendation:** Consider `react-easy-crop` or a custom CSS transform solution. The viewfinder overlay approach (full image visible with a draggable frame) is more intuitive than "drag image inside a box", especially on mobile.

---

### 2. Editorial Theme Polish

**Current state:** Editorial layout works but has clutter. This is the FREE tier layout so it needs to be excellent on its own.

**Specific changes:**
- **Remove "X photographs" counter** — debug clutter. Remove the entire photo count + divider section (lines 180-196 in EditorialLayout.tsx). Move `id="work"` anchor to the grid wrapper.
- **Keep footer branding** — "Hosted on slanthour.com" stays
- **No hover captions** — Editorial is minimalist; let the work speak for itself
- **Clean up hardcoded gradient colors** — banner gradient uses `rgba(10,9,8,...)` which should derive from theme bg color
- **Fix `whiteSpace: "nowrap"` on title** — breaks on mobile with long titles. Make conditional or use truncation.

**Files to modify:**
- `src/components/portfolio/themes/EditorialLayout.tsx`

---

### 3. Banner Title Accent Color (Two-Line Title)

**Context:** The legacy portfolio at `/sihas-abeywickrama` has "Between" in white and "Stones" in accent (#9c8e7a). This two-tone effect is a signature aesthetic.

**Approach — two-field title (recommended over character-index splitting):**
```
Title line 1: "Between"      → rendered in default text color
Title line 2: "Stones"       → rendered in accent color, italic
```

This is simpler for users, avoids character-index fragility, and matches the legacy design exactly (which uses `<br>` between the two words). If line 2 is empty, title renders as a single line (current behavior).

**DB migration:**
```sql
ALTER TABLE portfolios ADD COLUMN title_line2 TEXT;
ALTER TABLE portfolios ADD COLUMN title_line2_accent BOOLEAN DEFAULT false;
```

**Files to modify:**
- `src/types/index.ts` — add `title_line2`, `title_line2_accent` to Portfolio
- `src/components/dashboard/PortfolioSettings.tsx` — add line 2 input + accent toggle
- All three layout files — update title rendering to support two-line split
- New migration file

---

### 4. Tier Gating — Free vs Pro

**What needs enforcing:**

**ThemePicker (src/components/dashboard/ThemePicker.tsx):**
- Journal and Cinematic cards should show a "PRO" badge and be non-selectable for free users
- Clicking a locked theme should show an upgrade prompt instead of the confirm dialog
- ThemePicker receives the user's tier (passed from settings page which fetches profile)

**Username Changes (src/components/dashboard/ProfileForm.tsx):**
- Track username change history: new table or column `username_changed_at TIMESTAMPTZ` on profiles
- Free users: 1 change per calendar month. If they changed this month, disable the username field with "Next change available: {date}"
- When username changes: update the profile, old URL stops working immediately (no redirect — the `[username]` route simply won't find the old username)
- Pro users: TBD (potentially unlimited or higher limit)

**DB migration needed:**
```sql
ALTER TABLE profiles ADD COLUMN username_changed_at TIMESTAMPTZ;
```

**Files to modify:**
- `src/components/dashboard/ThemePicker.tsx` — add tier check + PRO badge
- `src/components/dashboard/ProfileForm.tsx` — add username change limit
- `src/app/dashboard/settings/page.tsx` — pass tier to ThemePicker
- `src/lib/constants.ts` — add `THEME_ACCESS` map (which tiers can use which themes)
- New migration file

---

## Known Issues / Tech Debt

1. **Lightbox hardcodes fonts** — Uses "DM Mono" and "Cormorant Garamond" directly instead of theme fonts.

2. **Gradient overlays use hardcoded rgba** — `rgba(10,9,8,...)` in EditorialLayout and `rgba(14,16,16,...)` in CinematicLayout should derive from theme bg color.

3. **`FONT_PAIRS` in constants.ts is unused** — Leftover from before locked themes. Can be removed.

4. **`whiteSpace: "nowrap"` on editorial title** — Overflows on mobile with long titles.

5. **No error boundaries** — Components don't have React error boundaries.

6. **Banner `object-position: center 40%` is hardcoded** — Should come from crop metadata (task 1).

7. **Cinematic slot algorithm** — `buildCinematicSlots()` doesn't handle 1-2 photos gracefully.

8. **Mobile lightbox UX** — Arrow buttons tiny on mobile. Touch hint needed.

---

## Environment & Deployment

- **Vercel:** Auto-deploys from `main` branch on GitHub (SihasA/slanthour)
- **Supabase project ref:** `sratnrbvvalbmiswwzpc`
- **Migrations:** Run via `npx supabase db push` after `npx supabase link`
- **Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Test account:** sihas@slanthour.com (credentials removed from repo — see local password manager) (username: sihas, 2 photos, published)
- **Google OAuth:** Configured in Google Cloud Console project "slanthour"

---

## Legacy Portfolio Reference

The original portfolio at `/sihas-abeywickrama` is served as static HTML via next.config.ts rewrite. It demonstrates the target aesthetic:
- Two-tone title: "Between" (white) + "Stones" (accent, italic)
- 3-column square grid, 3px gaps
- Dark theme with warm accent (#9c8e7a)
- Fixed header with scroll-aware transparency
- Copy protection, lightbox

Reference HTML files for all three themes were previously provided at `/Users/Sabey/Downloads/theme-editorial.html`, `theme-journal.html`, `theme-cinematic.html`.
