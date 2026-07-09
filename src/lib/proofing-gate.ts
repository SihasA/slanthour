// ─── Proofing gallery access gate ────────────────────────────────────
// Same HMAC cookie pattern as the page gate (src/lib/page-gate.ts),
// namespaced separately so unlocking a gallery can never unlock a page
// and vice versa. Token payload carries the gallery id + expiry only.

import { cookies } from "next/headers";
import { createGateToken, verifyGateToken } from "./page-gate";

const TTL_SECONDS = 60 * 60 * 12; // 12 hours — one client review session

export function proofingGateCookieName(galleryId: string): string {
  return `sh_proof_${galleryId.replace(/[^a-zA-Z0-9-]/g, "")}`;
}

function getSecret(): string {
  const secret = process.env.PAGE_GATE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("PAGE_GATE_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is not set");
  // Distinct namespace: a page-gate token can never validate here.
  return `proof-gate:${secret}`;
}

export async function grantGalleryAccess(galleryId: string): Promise<void> {
  const store = await cookies();
  store.set(proofingGateCookieName(galleryId), await createGateToken(galleryId, getSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TTL_SECONDS,
    path: "/",
  });
}

export async function hasGalleryAccess(galleryId: string): Promise<boolean> {
  const store = await cookies();
  const token = store.get(proofingGateCookieName(galleryId))?.value;
  return verifyGateToken(token, galleryId, getSecret());
}
