// ─── Server-side upload validation ───────────────────────────────────
// Validates actual file signatures (magic bytes), not extensions or the
// client-supplied MIME type — a renamed .exe cannot pass as a JPEG.

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // per variant
export const MAX_BLUR_LENGTH = 4_000; // data-URL placeholder cap
export const MAX_IMAGE_DIMENSION = 10_000;

export type SniffedType = "jpeg" | "png" | "webp" | null;

/** Identify an image by its magic bytes. */
export function sniffImageType(bytes: Uint8Array): SniffedType {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // WEBP
  ) {
    return "webp";
  }
  return null;
}

export interface UploadCheck {
  ok: boolean;
  error?: string;
}

/** Validate one uploaded variant blob (already read into memory). */
export function checkUploadedImage(bytes: Uint8Array): UploadCheck {
  if (bytes.length === 0) return { ok: false, error: "Empty file." };
  if (bytes.length > MAX_UPLOAD_BYTES)
    return { ok: false, error: "File too large (20 MB max)." };
  const type = sniffImageType(bytes);
  if (!type)
    return { ok: false, error: "Unsupported file type. Use JPEG, PNG or WebP photographs." };
  return { ok: true };
}

/** Sanitise a client-supplied filename for storage in metadata. */
export function safeFilename(name: unknown): string {
  const base = typeof name === "string" && name ? name : "photo.jpg";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

/** Validate client-reported dimensions. */
export function checkDimensions(width: unknown, height: unknown): { width: number; height: number } | null {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isInteger(w) || !Number.isInteger(h)) return null;
  if (w < 1 || h < 1 || w > MAX_IMAGE_DIMENSION || h > MAX_IMAGE_DIMENSION) return null;
  return { width: w, height: h };
}

/** Validate the tiny blur placeholder (must be a small image data URL). */
export function checkBlurDataUrl(blur: unknown): string | null {
  if (typeof blur !== "string" || blur.length === 0) return null;
  if (blur.length > MAX_BLUR_LENGTH) return null;
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(blur)) return null;
  return blur;
}
