"use server";

// ─── Password-protected page unlock ──────────────────────────────────
// Anonymous visitors post the page password here. Rate limited per
// IP+page; a correct password sets the HMAC gate cookie (12 h). The raw
// password is never stored or logged.

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPagePassword } from "@/lib/page-password";
import { grantPageAccess } from "@/lib/page-gate";
import { rateLimit } from "@/lib/rate-limit";

export interface UnlockResult {
  ok: boolean;
  error?: string;
}

export async function unlockPage(pageId: string, password: string): Promise<UnlockResult> {
  if (typeof pageId !== "string" || typeof password !== "string" || password.length > 100) {
    return { ok: false, error: "That password isn't right." };
  }

  const headerStore = await headers();
  const ip = (headerStore.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const limited = rateLimit("page-unlock", `${ip}:${pageId}`, 10, 60);
  if (!limited.allowed) {
    return { ok: false, error: "Too many attempts — wait a minute and try again." };
  }

  // Password pages are not anon-readable by design, so this lookup uses the
  // service-role client with checks in code.
  const admin = createAdminClient();
  const { data: page } = await admin
    .from("pages")
    .select("id, is_published, visibility, password_hash")
    .eq("id", pageId)
    .single();

  if (!page || !page.is_published || page.visibility !== "password" || !page.password_hash) {
    return { ok: false, error: "That password isn't right." };
  }

  const valid = await verifyPagePassword(password, page.password_hash);
  if (!valid) return { ok: false, error: "That password isn't right." };

  await grantPageAccess(page.id);
  return { ok: true };
}
