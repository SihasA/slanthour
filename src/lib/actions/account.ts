"use server";

// ─── Account management ──────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMfaChallengePending, MFA_PENDING_MESSAGE } from "@/lib/auth/mfa-server";
import { MEDIA_BUCKET } from "@/lib/constants";
import type { ActionResult } from "./pages";

/**
 * Delete the caller's account: storage files, then the auth user (profiles,
 * pages and media_assets rows cascade via foreign keys). Confirmation is
 * enforced in the UI; this action re-checks the typed phrase server-side.
 */
export async function deleteAccount(confirmation: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };
  // Block destructive account deletion for a session that has not cleared its
  // 2FA challenge, before any storage or auth records are removed.
  if (await isMfaChallengePending(supabase)) return { ok: false, error: MFA_PENDING_MESSAGE };
  if (confirmation !== "delete my account")
    return { ok: false, error: "Type the confirmation phrase exactly." };

  const admin = createAdminClient();

  // Remove every storage object under the user's folder (batched).
  let offset = 0;
  const paths: string[] = [];
  // list() is per-directory, so walk the known layout: root files, photos/, m/<asset>/
  const { data: rootEntries } = await admin.storage.from(MEDIA_BUCKET).list(user.id, { limit: 1000 });
  for (const entry of rootEntries ?? []) {
    if (entry.id) paths.push(`${user.id}/${entry.name}`);
    else {
      const { data: children } = await admin.storage
        .from(MEDIA_BUCKET)
        .list(`${user.id}/${entry.name}`, { limit: 1000 });
      for (const child of children ?? []) {
        if (child.id) paths.push(`${user.id}/${entry.name}/${child.name}`);
        else {
          const { data: grandchildren } = await admin.storage
            .from(MEDIA_BUCKET)
            .list(`${user.id}/${entry.name}/${child.name}`, { limit: 1000 });
          for (const gc of grandchildren ?? [])
            paths.push(`${user.id}/${entry.name}/${child.name}/${gc.name}`);
        }
      }
    }
  }
  while (offset < paths.length) {
    const batch = paths.slice(offset, offset + 100);
    await admin.storage.from(MEDIA_BUCKET).remove(batch);
    offset += 100;
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: "Could not delete the account. Contact support." };

  return { ok: true };
}
