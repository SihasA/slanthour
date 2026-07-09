"use client";

// ─── Proofing upload orchestration (owner dashboard) ─────────────────
// Shoots are big, so this favours throughput and steady feedback:
// a small concurrency pool, per-file results, one refresh at the end.
// Variants are md + sm only — see prepareProofingUpload.

import { prepareProofingUpload } from "./image";
import { validateFileLocally } from "./upload-client";
import type { ProofingImage } from "@/types";

export interface ProofingUploadResult {
  ok: boolean;
  image?: ProofingImage;
  filename: string;
  error?: string;
}

async function uploadOne(
  galleryId: string,
  file: File,
  position: number
): Promise<ProofingUploadResult> {
  const localError = validateFileLocally(file);
  if (localError) return { ok: false, filename: file.name, error: localError };

  let prepared;
  try {
    prepared = await prepareProofingUpload(file);
  } catch {
    return { ok: false, filename: file.name, error: `Could not read “${file.name}”.` };
  }

  const form = new FormData();
  form.set("md", prepared.variants.md);
  form.set("sm", prepared.variants.sm);
  form.set("width", String(prepared.width));
  form.set("height", String(prepared.height));
  form.set("filename", file.name);
  form.set("position", String(position));

  try {
    const res = await fetch(`/api/proofing/${galleryId}/images`, { method: "POST", body: form });
    const body = await res.json();
    if (res.ok && body.image) return { ok: true, filename: file.name, image: body.image };
    return { ok: false, filename: file.name, error: body.error ?? "Upload failed." };
  } catch {
    return { ok: false, filename: file.name, error: "Network error." };
  }
}

/**
 * Upload a batch with limited concurrency. `startPosition` is the number
 * of photos already in the gallery so batch order continues after them.
 */
export async function uploadProofingBatch(
  galleryId: string,
  files: File[],
  startPosition: number,
  onProgress?: (done: number, total: number) => void
): Promise<ProofingUploadResult[]> {
  const results: ProofingUploadResult[] = new Array(files.length);
  let next = 0;
  let done = 0;

  async function worker() {
    while (next < files.length) {
      const index = next++;
      results[index] = await uploadOne(galleryId, files[index], startPosition + index);
      done++;
      onProgress?.(done, files.length);
    }
  }

  const workers = Array.from({ length: Math.min(3, files.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
