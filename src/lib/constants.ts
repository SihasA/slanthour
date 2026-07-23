// ─── Photo upload constraints ────────────────────────────────
export const PHOTO_MAX_DIMENSION = 2000;
export const PHOTO_QUALITY = 0.8;
export const PHOTO_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const PHOTO_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// ─── Media pipeline ─────────────────────────────────────────
// Responsive variants generated client-side (canvas re-encode, which also
// strips EXIF/GPS) and validated server-side before storage.
export const MEDIA_VARIANTS = {
  lg: { maxDimension: 2000, quality: 0.82 },
  md: { maxDimension: 1000, quality: 0.78 },
  sm: { maxDimension: 480, quality: 0.72 },
} as const;
// High-fidelity variant (Pro+ uploads): generated only when the source is
// actually larger than lg, and dropped otherwise — never an upscale.
export const MEDIA_VARIANT_XL = { maxDimension: 2560, quality: 0.85 } as const;
export const MEDIA_BLUR_DIMENSION = 16;
export const MEDIA_BUCKET = "portfolios"; // historical bucket name, kept for data continuity

// Name-stamp watermark composited client-side onto lg/md/sm/xl variants at
// upload (MONETIZATION_PLAN.md §3.9). Bottom-right corner wordmark; tuned to
// stay legible without reading as heavy-handed stock-photo tiling.
export const MEDIA_WATERMARK = {
  opacity: 0.72,
  shadowAlpha: 0.45,
  sizeRatio: 0.035,
  minSize: 11,
  maxSize: 64,
  padRatio: 0.04,
  maxChars: 40,
} as const;

// ─── Keepsake archive export ─────────────────────────────────
// The static archive route (src/app/api/keepsake/[pageId]/archive/route.ts)
// runs on a 60s route budget (maxDuration) while fetching every photo at
// IMAGE_FETCH_CONCURRENCY = 6 and streaming a hand-rolled zip whose
// end-of-central-directory trailer is only written once every image has
// arrived. A platform timeout mid-stream kills the response before that
// trailer is written, leaving a zip an unzip tool reports as corrupt, with
// no explanation for the buyer. Studio, the top tier, caps a page at 500
// images (see maxImagesPerPage in entitlements.ts); 300 comfortably clears
// 6-way concurrent fetches within 60s while still leaving real headroom
// under that cap, so it guards the extreme case without limiting normal use.
export const KEEPSAKE_ARCHIVE_MAX_IMAGES = 300;

// ─── Reserved slugs ─────────────────────────────────────────
// Blocked as usernames AND page slugs — they collide with (or could be
// confused with) application routes.
export const RESERVED_SLUGS = [
  "login",
  "signup",
  "logout",
  "forgot-password",
  "reset-password",
  "dashboard",
  "settings",
  "editor",
  "pages",
  "page",
  "pricing",
  "admin",
  "api",
  "app",
  "auth",
  "about",
  "contact",
  "terms",
  "privacy",
  "legal",
  "blog",
  "help",
  "support",
  "docs",
  "explore",
  "search",
  "new",
  "edit",
  "delete",
  "media",
  "proof",
  "proofing",
  "assets",
  "static",
  "public",
  "demo",
  "keepsake-view",
  "slanthour",
  "arborai",
  "arbor",
  "brand",
  "legacy",
] as const;
