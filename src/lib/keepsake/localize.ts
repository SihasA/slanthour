// ─── HTML localization ─────────────────────────────────────────────────
// Two jobs: (1) collapse every Supabase URL variant of an asset (sm/md/lg/
// xl, watermarked or not — whichever the render actually used, which
// depends on the page's serving-cap and watermark settings) down to the
// single local file fetched for the zip; (2) neutralize the JS-gated
// reveal/opacity animations so the page isn't blank with no JS. Both pure
// string operations — no DOM parser, no new dependency.

import { imageUrl, type MediaVariant } from "@/lib/media";
import type { ArchiveImageEntry } from "./collect";

const VARIANTS: MediaVariant[] = ["sm", "md", "lg", "xl"];

/** Every URL that could appear in the rendered HTML for one image, across
 * every variant and watermark state — imageUrl() itself collapses xl to lg
 * when there's no xl file, and ignores the watermark flag entirely for
 * legacy/absolute-path images, so a Set naturally dedupes those cases. */
function candidateUrls(entry: ArchiveImageEntry): string[] {
  const urls = new Set<string>();
  for (const variant of VARIANTS) {
    urls.add(imageUrl(entry.image, variant, false));
    if (entry.image.hasWatermark) urls.add(imageUrl(entry.image, variant, true));
  }
  return [...urls];
}

/** Replace every URL referencing a collected image with its local zip path,
 * then strip the now-meaningless srcset/sizes attributes (one local file
 * has no responsive variants to offer). */
export function localizeHtml(html: string, images: ArchiveImageEntry[]): string {
  let out = html;
  for (const entry of images) {
    for (const url of candidateUrls(entry)) {
      if (url === "") continue;
      out = out.split(url).join(entry.localPath);
    }
  }
  out = out.replace(/ srcset="[^"]*"/g, "").replace(/ sizes="[^"]*"/g, "");
  return out;
}

/** Reveal (scroll-fade) and SmartImage (load-fade) both render at
 * opacity-0/translate-y-4 until client JS un-hides them. A static archive
 * has no JS, so force both open — see src/themes/shared/primitives.tsx
 * (Reveal) and src/themes/shared/SmartImage.tsx. */
export function revealOverrideCss(): string {
  return `
/* Keepsake archive: this file has no JS, so the reveal-on-scroll and
   image-load fade effects that depend on it are neutralized here instead
   of left invisible. */
.sh-page .opacity-0 { opacity: 1 !important; }
.sh-page .translate-y-4 { transform: none !important; }
`;
}
