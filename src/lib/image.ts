import { PHOTO_MAX_DIMENSION, PHOTO_QUALITY } from "./constants";

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

/**
 * Generate a unique storage path for a photo upload.
 */
export function generateStoragePath(
  userId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/photos/${timestamp}_${safe}`;
}

/**
 * Generate the storage path for a user's banner image.
 */
export function generateBannerPath(userId: string): string {
  return `${userId}/banner.jpg`;
}
