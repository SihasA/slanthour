// ─── Keepsake archive size guard ──────────────────────────────────────
// A pure predicate, tested without a DOM/DB, so the route can reject an
// over-limit export before starting any expensive work (SSR self-fetch,
// Tailwind compile, image streaming). See KEEPSAKE_ARCHIVE_MAX_IMAGES
// (src/lib/constants.ts) for why 300 is the chosen ceiling.

import { KEEPSAKE_ARCHIVE_MAX_IMAGES } from "@/lib/constants";

/** True when an archive with this many images can be started safely —
 * i.e. it should comfortably finish within the route's maxDuration budget.
 * False means the route must refuse the export up front rather than begin
 * a stream that could be killed mid-zip. */
export function isArchivableImageCount(imageCount: number): boolean {
  return imageCount <= KEEPSAKE_ARCHIVE_MAX_IMAGES;
}
