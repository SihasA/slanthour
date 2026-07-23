"use client";

// ─── Client upload orchestration ─────────────────────────────────────
// Validates locally (fast feedback), generates variants, then POSTs to
// /api/media with progress reporting via XHR. The server re-validates.

import { PHOTO_ACCEPTED_TYPES, PHOTO_MAX_FILE_SIZE } from "./constants";
import { prepareUpload } from "./image";
import type { MediaAsset } from "@/types";

export interface UploadResult {
  ok: boolean;
  asset?: MediaAsset;
  error?: string;
}

// iPhones shoot HEIC/HEIF by default, so it is by far the most common
// rejected format for our audience. Browsers can't reliably decode it (and
// often send an empty file.type for it), so we can't accept it yet, but we
// can name it and tell the photographer exactly how to get past it instead
// of the generic "unsupported format" dead-end.
function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  return /\.hei[cf]$/i.test(file.name);
}

export function validateFileLocally(file: File): string | null {
  if (isHeic(file)) {
    return `“${file.name}” looks like an iPhone HEIC photo, which isn't supported yet. Export or share it as JPEG first, or set iOS Camera to “Most Compatible” (Settings › Camera › Formats).`;
  }
  if (!PHOTO_ACCEPTED_TYPES.includes(file.type)) {
    return `“${file.name}” isn't a supported format. Use JPEG, PNG or WebP.`;
  }
  if (file.size > PHOTO_MAX_FILE_SIZE) {
    return `“${file.name}” is over 20 MB.`;
  }
  return null;
}

export async function uploadPhoto(
  file: File,
  onProgress?: (fraction: number) => void,
  opts?: { hiFi?: boolean; watermarkLabel?: string }
): Promise<UploadResult> {
  const localError = validateFileLocally(file);
  if (localError) return { ok: false, error: localError };

  let prepared;
  try {
    prepared = await prepareUpload(file, opts);
  } catch {
    return { ok: false, error: `Could not read “${file.name}”. The file may be corrupted.` };
  }

  const form = new FormData();
  form.set("lg", prepared.variants.lg);
  form.set("md", prepared.variants.md);
  form.set("sm", prepared.variants.sm);
  if (prepared.xl) form.set("xl", prepared.xl);
  if (prepared.wm) {
    form.set("wm_lg", prepared.wm.lg);
    form.set("wm_md", prepared.wm.md);
    form.set("wm_sm", prepared.wm.sm);
    if (prepared.wm.xl) form.set("wm_xl", prepared.wm.xl);
  }
  form.set("blur", prepared.blurDataUrl);
  form.set("width", String(prepared.width));
  form.set("height", String(prepared.height));
  form.set("filename", file.name);

  return new Promise<UploadResult>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && body.asset) resolve({ ok: true, asset: body.asset });
        else resolve({ ok: false, error: body.error ?? "Upload failed." });
      } catch {
        resolve({ ok: false, error: "Upload failed." });
      }
    };
    xhr.onerror = () => resolve({ ok: false, error: "Network error. Check your connection and retry." });
    xhr.onabort = () => resolve({ ok: false, error: "Upload cancelled." });
    xhr.send(form);
  });
}

export async function deleteMediaAsset(assetId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/media/${assetId}`, { method: "DELETE" });
    const body = await res.json();
    if (res.ok) return { ok: true };
    return { ok: false, error: body.error ?? "Could not delete the image." };
  } catch {
    return { ok: false, error: "Network error. Try again." };
  }
}
