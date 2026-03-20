# Slant Hour — Branding Context

## Brand Colours

| Token   | Hex       | Use                                          |
|---------|-----------|----------------------------------------------|
| Orange  | `#FF6B00` | Primary accent, icon background, CTAs        |
| Grey    | `#2A2424` | Dark text, icon foreground, dark-mode base   |

These are already wired into Tailwind as `color_accent` in the theme system. The CSS variables `--color-accent` will reflect the user's theme accent, but for brand assets (favicon, OG image, logos) always use the hex values above directly.

---

## Figma Export Specs

### What to export WITH transparent background (no background)
Everything except the OG image and app icons. Your logo assets live on the page — the surrounding UI provides the background. Exporting with a white or coloured background would break dark-mode.

### What to export WITH a background
- `og-image.png` — needs a real background (use `#2A2424` grey or a moody photo)
- `apple-touch-icon.png` — needs a solid background (use `#2A2424` or `#FF6B00`)
- PWA icons (`icon-192.png`, `icon-512.png`) — need solid background for home screen

---

## File Map — Where Each Asset Goes

### `/public/favicon.svg`
- **What:** Tiny icon, icon/mark only (no wordmark)
- **Artboard:** 32 × 32 px
- **Background:** Transparent
- **Colours:** Orange `#FF6B00` background circle/shape, Grey `#2A2424` letterform
- **Used at:** Browser tab, bookmarks
- **Figma export:** File → Export → SVG, 32×32 frame

---

### `/public/brand/icon.svg`
- **What:** Logomark only (the symbol/icon, no "Slant Hour" text)
- **Artboard:** 100 × 100 px (square)
- **Background:** Transparent
- **Used at:** Dashboard sidebar small logo spot, login page, small UI contexts
- **Figma export:** File → Export → SVG, 100×100 frame

---

### `/public/brand/wordmark.svg`
- **What:** Logotype only — the text "Slant Hour" in your brand typeface, no icon
- **Artboard:** ~400 × 80 px (wide, short)
- **Background:** Transparent
- **Colours:** `#2A2424` for light backgrounds (the dark version is default)
- **Used at:** Landing page header, sidebar on desktop, footer
- **Figma export:** File → Export → SVG, fitted to text bounds
- **Note:** If you want a white/light version for dark contexts, export a second copy and place it at `/public/brand/wordmark-white.svg`

---

### `/public/brand/logo-light.svg`
- **What:** Full logo — icon + wordmark together, for LIGHT backgrounds
- **Artboard:** Flexible (e.g. 240 × 200 px stacked, or 400 × 100 px horizontal)
- **Background:** Transparent
- **Colours:** Icon in `#FF6B00`, wordmark in `#2A2424`
- **Used at:** Light-mode pages, light portfolio themes
- **Figma export:** File → Export → SVG

---

### `/public/brand/logo-dark.svg`
- **What:** Full logo — icon + wordmark together, for DARK backgrounds
- **Artboard:** Same dimensions as logo-light.svg
- **Background:** Transparent
- **Colours:** Icon in `#FF6B00`, wordmark in `#FF6B00` (orange — same as light version)
- **Used at:** Dark-mode pages, dark portfolio themes, email footers
- **Note:** Orange reads well on both light and dark — no need for a white variant
- **Figma export:** File → Export → SVG

---

### `/public/apple-touch-icon.png`
- **What:** iOS home screen icon
- **Artboard:** 180 × 180 px (Apple spec)
- **Background:** SOLID — use `#2A2424` (dark) — Apple clips to rounded square automatically
- **Content:** Logomark centred with padding, orange on dark
- **Figma export:** File → Export → PNG @1x, 180×180 frame

---

### `/public/og-image.png`
- **What:** Social share preview image (Twitter, Facebook, iMessage link previews)
- **Artboard:** 1200 × 630 px
- **Background:** SOLID or photo — suggested: dark moody photo or flat `#2A2424`
- **Content:** Logo centred or left-aligned, tagline "A home for your best work"
- **Figma export:** File → Export → PNG @1x, 1200×630 frame

---

### `/public/brand/icon-192.png` and `/public/brand/icon-512.png`
- **What:** PWA icons (Android home screen, Chrome install prompt)
- **Artboard:** 192×192 and 512×512 px respectively
- **Background:** SOLID — use `#FF6B00` (orange) — looks best on home screens
- **Content:** Logomark centred with generous padding
- **Figma export:** File → Export → PNG @1x at the matching size

---

## After Replacing the Files

Once you've dropped your Figma exports in place, update these two code locations:

### 1. `src/app/layout.tsx` — metadata block
The metadata already references `og-image.png`. After you place that file, add the favicon and apple-touch-icon references:
```tsx
export const metadata: Metadata = {
  title: "Slant Hour — A home for your best work",
  description: "...",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    ...
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};
```

### 2. `src/components/dashboard/Sidebar.tsx` — swap text logo for SVG
Replace:
```tsx
<Link href="/" className="font-heading text-lg italic ...">
  Slant Hour
</Link>
```
With:
```tsx
<Link href="/">
  <img src="/brand/wordmark.svg" alt="Slant Hour" className="h-6 w-auto" />
</Link>
```
(Use `logo-dark.svg` or `logo-light.svg` if you want icon + wordmark together)

### 3. `src/app/page.tsx` — landing page header + footer
Same swap as Sidebar — replace the text `<span>Slant Hour</span>` with `<img>` referencing the appropriate SVG.

---

## Summary: Background Guide

| File                    | Background  | Why                                      |
|-------------------------|-------------|------------------------------------------|
| `favicon.svg`           | Transparent | Browser renders on its own bg            |
| `brand/icon.svg`        | Transparent | UI provides context                      |
| `brand/wordmark.svg`    | Transparent | Used on both light and dark pages        |
| `brand/logo-light.svg`  | Transparent | Light UI pages                           |
| `brand/logo-dark.svg`   | Transparent | Dark UI pages                            |
| `apple-touch-icon.png`  | Solid       | iOS requires opaque home screen icon     |
| `og-image.png`          | Solid/photo | Social cards need a real background      |
| `brand/icon-192.png`    | Solid       | Android PWA home screen                  |
| `brand/icon-512.png`    | Solid       | Android PWA splash / install prompt      |
