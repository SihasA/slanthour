// ─── Media URL resolution ────────────────────────────────────────────
// One place that knows how a PageImage path becomes a browser URL, and
// which responsive variants exist. Works in server and client components.

import { MEDIA_BUCKET } from "./constants";
import type { PageImage } from "./page-document";

export type MediaVariant = "xl" | "lg" | "md" | "sm";

const VARIANT_SIZE: Record<MediaVariant, number> = { sm: 480, md: 1000, lg: 2000, xl: 2560 };

/** Clamp a requested variant to a page's serving cap (no cap = unchanged). */
export function clampVariant(variant: MediaVariant, max?: MediaVariant): MediaVariant {
  if (!max) return variant;
  return VARIANT_SIZE[variant] > VARIANT_SIZE[max] ? max : variant;
}

function publicUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

/** New-pipeline assets live at {userId}/m/{assetId}/lg.jpg with siblings. */
function variantPath(lgPath: string, variant: MediaVariant): string {
  return variant === "lg" ? lgPath : lgPath.replace(/lg\.jpg$/, `${variant}.jpg`);
}

/**
 * Resolve the URL for a page image. `path` may be an absolute URL (demo
 * fixtures) or a storage path; legacy single-file assets have no variants.
 * Asking for xl on an image without one falls back to lg.
 */
export function imageUrl(
  image: Pick<PageImage, "path" | "hasVariants" | "hasXl">,
  variant: MediaVariant = "lg"
): string {
  if (image.path.startsWith("http") || image.path.startsWith("/")) return image.path;
  if (!image.hasVariants) return publicUrl(image.path);
  const v = variant === "xl" && !image.hasXl ? "lg" : variant;
  return publicUrl(variantPath(image.path, v));
}

/** srcSet string for responsive rendering (only when variants exist).
 * `max` caps the largest variant offered (page-level serving cap). */
export function imageSrcSet(
  image: Pick<PageImage, "path" | "hasVariants" | "hasXl" | "width">,
  max?: MediaVariant
): string | undefined {
  if (image.path.startsWith("http") || image.path.startsWith("/") || !image.hasVariants) return undefined;
  const w = image.width ?? 2000;
  const entries = [`${imageUrl(image, "sm")} 480w`, `${imageUrl(image, "md")} 1000w`];
  if (clampVariant("lg", max) === "lg") {
    entries.push(`${imageUrl(image, "lg")} ${Math.min(w, 2000)}w`);
    // width/height describe the lg variant; the xl file is 2560 on its long edge.
    if (image.hasXl && clampVariant("xl", max) === "xl") entries.push(`${imageUrl(image, "xl")} 2560w`);
  }
  return entries.join(", ");
}

/** URL for a bare storage path (page covers, avatars). */
export function storageUrl(path: string): string {
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return publicUrl(path);
}
