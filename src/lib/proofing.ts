// ─── Proofing gallery helpers ────────────────────────────────────────
// Shared between the owner dashboard, the anonymous /proof route, and
// the upload/selection endpoints. Proofing images exist as sm/md only
// (§3.7): md is the stored path, sm sits alongside; lg/xl never exist.

import { MEDIA_BUCKET } from "./constants";

export const PROOFING_MAX_IMAGES = 1000;
export const PROOFING_TITLE_MAX_LENGTH = 120;

export type ProofingVariant = "sm" | "md";

/** Browser URL for a proofing image variant. `storagePath` is the md path. */
export function proofingImageUrl(storagePath: string, variant: ProofingVariant = "md"): string {
  const path = variant === "md" ? storagePath : storagePath.replace(/md\.jpg$/, "sm.jpg");
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_LENGTH = 20;

/**
 * Unguessable share token. 20 chars over a 36-symbol alphabet ≈ 103 bits —
 * the link is the credential for password-less galleries, so this must
 * never be derived from user input. Rejection sampling keeps it unbiased.
 */
export function newProofingSlug(): string {
  const out: string[] = [];
  const bytes = new Uint8Array(SLUG_LENGTH * 2);
  while (out.length < SLUG_LENGTH) {
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (out.length === SLUG_LENGTH) break;
      // Reject values that would bias the modulo (256 % 36 !== 0).
      if (b < 252) out.push(SLUG_ALPHABET[b % SLUG_ALPHABET.length]);
    }
  }
  return out.join("");
}

/** Human label for a tier's gallery allowance ("3", "Unlimited"). */
export function proofingLimitLabel(limit: number): string {
  return Number.isFinite(limit) ? String(limit) : "Unlimited";
}
