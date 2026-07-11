// ─── Media URL resolution ────────────────────────────────────────────
// One place that knows how a PageImage path becomes a browser URL, and
// which responsive variants exist. Works in server and client components.

import { MEDIA_BUCKET } from "./constants";
import { newSectionId, type PageImage } from "./page-document";
import type { MediaAsset } from "@/types";

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

/** New-pipeline assets live at {userId}/m/{assetId}/lg.jpg with siblings.
 * Watermarked siblings sit alongside as {variant}.wm.jpg. */
function variantPath(lgPath: string, variant: MediaVariant, watermarked = false): string {
  const name = watermarked ? `${variant}.wm.jpg` : `${variant}.jpg`;
  return !watermarked && variant === "lg" ? lgPath : lgPath.replace(/lg\.jpg$/, name);
}

/**
 * Resolve the URL for a page image. `path` may be an absolute URL (demo
 * fixtures) or a storage path; legacy single-file assets have no variants.
 * Asking for xl on an image without one falls back to lg. `watermarked`
 * resolves the name-stamped sibling only when the image actually has one
 * (graceful fallback to clean, like `hasXl`).
 */
export function imageUrl(
  image: Pick<PageImage, "path" | "hasVariants" | "hasXl" | "hasWatermark">,
  variant: MediaVariant = "lg",
  watermarked = false
): string {
  if (image.path.startsWith("http") || image.path.startsWith("/")) return image.path;
  if (!image.hasVariants) return publicUrl(image.path);
  const v = variant === "xl" && !image.hasXl ? "lg" : variant;
  const wm = watermarked && image.hasWatermark === true;
  return publicUrl(variantPath(image.path, v, wm));
}

/** srcSet string for responsive rendering (only when variants exist).
 * `max` caps the largest variant offered (page-level serving cap);
 * `watermarked` threads the name-stamped variant through every entry. */
export function imageSrcSet(
  image: Pick<PageImage, "path" | "hasVariants" | "hasXl" | "hasWatermark" | "width">,
  max?: MediaVariant,
  watermarked = false
): string | undefined {
  if (image.path.startsWith("http") || image.path.startsWith("/") || !image.hasVariants) return undefined;
  const w = image.width ?? 2000;
  const entries = [
    `${imageUrl(image, "sm", watermarked)} 480w`,
    `${imageUrl(image, "md", watermarked)} 1000w`,
  ];
  if (clampVariant("lg", max) === "lg") {
    entries.push(`${imageUrl(image, "lg", watermarked)} ${Math.min(w, 2000)}w`);
    // width/height describe the lg variant; the xl file is 2560 on its long edge.
    if (image.hasXl && clampVariant("xl", max) === "xl")
      entries.push(`${imageUrl(image, "xl", watermarked)} 2560w`);
  }
  return entries.join(", ");
}

/** A fresh document placement of a stored asset. Every placement gets its
 * own id (and its own caption/alt/focal), so the same asset can appear in
 * several sections or pages while being stored exactly once. */
export function pageImageFromAsset(asset: MediaAsset): PageImage {
  return {
    id: newSectionId(),
    assetId: asset.id,
    path: asset.storage_path,
    hasVariants: asset.has_variants,
    hasXl: asset.has_xl,
    hasWatermark: asset.has_watermark,
    width: asset.width,
    height: asset.height,
    alt: "",
    caption: "",
    blur: asset.blur_data_url,
  };
}

/** URL for a bare storage path (page covers, avatars). */
export function storageUrl(path: string): string {
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return publicUrl(path);
}
