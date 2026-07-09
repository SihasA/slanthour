import {
  PHOTO_MAX_DIMENSION,
  PHOTO_QUALITY,
  MEDIA_VARIANTS,
  MEDIA_VARIANT_XL,
  MEDIA_BLUR_DIMENSION,
} from "./constants";

interface CompressResult {
  blob: Blob;
  width: number;
  height: number;
}

interface CompressOptions {
  maxDimension?: number;
  quality?: number;
}

/**
 * Compress and resize an image using the Canvas API.
 * Outputs JPEG regardless of input format.
 */
export async function compressImage(
  file: File,
  options?: CompressOptions
): Promise<CompressResult> {
  const maxDim = options?.maxDimension ?? PHOTO_MAX_DIMENSION;
  const quality = options?.quality ?? PHOTO_QUALITY;

  const bitmap = await createImageBitmap(file);
  const { width: origW, height: origH } = bitmap;

  // Calculate target dimensions
  let targetW = origW;
  let targetH = origH;
  const longest = Math.max(origW, origH);

  if (longest > maxDim) {
    const scale = maxDim / longest;
    targetW = Math.round(origW * scale);
    targetH = Math.round(origH * scale);
  }

  // Draw to canvas
  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // Fill white background for PNGs with transparency
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  const blob = await canvas.convertToBlob({
    type: "image/jpeg",
    quality,
  });

  return { blob, width: targetW, height: targetH };
}

// ─── Responsive upload preparation ───────────────────────────────────
// Produces the three display variants + blur placeholder for one photo.
// Canvas re-encoding strips all EXIF metadata (including GPS) by design —
// see ARCHITECTURE.md §9. Everything runs client-side; the server route
// re-validates signatures and sizes before storing.

export interface PreparedUpload {
  variants: { lg: Blob; md: Blob; sm: Blob };
  /** Hi-fi variant — present only for Pro+ uploads whose source out-resolves lg. */
  xl?: Blob;
  blurDataUrl: string;
  width: number;
  height: number;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// ─── Proofing upload preparation ─────────────────────────────────────
// Proofing galleries serve sm/md only (MONETIZATION_PLAN.md §3.7):
// no lg/xl, no blur placeholder — a shoot is hundreds of photos and
// every byte per row and per view is the marginal cost.

export interface PreparedProofingUpload {
  variants: { md: Blob; sm: Blob };
  width: number;
  height: number;
}

export async function prepareProofingUpload(file: File): Promise<PreparedProofingUpload> {
  const [md, sm] = await Promise.all([
    compressImage(file, MEDIA_VARIANTS.md),
    compressImage(file, MEDIA_VARIANTS.sm),
  ]);
  return { variants: { md: md.blob, sm: sm.blob }, width: md.width, height: md.height };
}

export async function prepareUpload(
  file: File,
  opts?: { hiFi?: boolean }
): Promise<PreparedUpload> {
  const [lg, md, sm, blur, xl] = await Promise.all([
    compressImage(file, MEDIA_VARIANTS.lg),
    compressImage(file, MEDIA_VARIANTS.md),
    compressImage(file, MEDIA_VARIANTS.sm),
    compressImage(file, { maxDimension: MEDIA_BLUR_DIMENSION, quality: 0.5 }),
    opts?.hiFi ? compressImage(file, MEDIA_VARIANT_XL) : Promise.resolve(null),
  ]);
  // compressImage never upscales, so a source ≤2000px yields an xl identical
  // in pixels to lg — keep xl only when it genuinely carries more resolution.
  const xlIsLarger = xl !== null && Math.max(xl.width, xl.height) > Math.max(lg.width, lg.height);
  return {
    variants: { lg: lg.blob, md: md.blob, sm: sm.blob },
    xl: xlIsLarger ? xl.blob : undefined,
    blurDataUrl: await blobToDataUrl(blur.blob),
    width: lg.width,
    height: lg.height,
  };
}
