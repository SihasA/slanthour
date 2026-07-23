"use server";

// ─── Proofing gallery mutations ──────────────────────────────────────
// Owner-side writes follow the same discipline as pages.ts: authenticate,
// load through the user-scoped client (RLS layer), assert ownership
// explicitly, sanitise input. The anonymous side (unlock + selections)
// uses the service-role client with checks in code, because gallery rows
// are deliberately not anon-readable.

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMfaChallengePending, MFA_PENDING_MESSAGE } from "@/lib/auth/mfa-server";
import { MEDIA_BUCKET } from "@/lib/constants";
import { getProfileEntitlements } from "@/lib/entitlements";
import { hashPagePassword, verifyPagePassword } from "@/lib/page-password";
import { grantGalleryAccess } from "@/lib/proofing-gate";
import { newProofingSlug, proofingLimitLabel, PROOFING_TITLE_MAX_LENGTH } from "@/lib/proofing";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";
import { validatePagePassword } from "@/lib/validation";
import type { ProofingGallery, ProofingStatus } from "@/types";

export type ActionError = { ok: false; error: string };
export type ActionResult<T = object> = ({ ok: true } & T) | ActionError;

const err = (error: string): ActionError => ({ ok: false, error });

// ─── Shared guards ───────────────────────────────────────────────────

async function requireUser(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string } } | ActionError
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err("Your session has expired. Sign in again.");
  // Reject a session that has not cleared its 2FA challenge (aal1 with a
  // verified factor), matching the enforcement in pages.ts.
  if (await isMfaChallengePending(supabase)) return err(MFA_PENDING_MESSAGE);
  return { supabase, user };
}

type GalleryGuard = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string };
  gallery: ProofingGallery;
};

async function requireGallery(galleryId: string): Promise<GalleryGuard | ActionError> {
  const ctx = await requireUser();
  if ("error" in ctx) return ctx;
  const { data } = await ctx.supabase
    .from("proofing_galleries")
    .select("*")
    .eq("id", galleryId)
    .single();
  const gallery = data as ProofingGallery | null;
  if (!gallery || gallery.user_id !== ctx.user.id) return err("Gallery not found.");
  return { supabase: ctx.supabase, user: ctx.user, gallery };
}

async function countActiveGalleries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("proofing_galleries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");
  return count ?? 0;
}

function cleanTitle(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, PROOFING_TITLE_MAX_LENGTH);
}

// ─── Owner actions ───────────────────────────────────────────────────

export async function createProofingGallery(
  rawTitle: string
): Promise<ActionResult<{ galleryId: string }>> {
  const ctx = await requireUser();
  if ("error" in ctx) return ctx;

  const title = cleanTitle(rawTitle);
  if (!title) return err("Give the gallery a name.");

  const { data: profile } = await ctx.supabase
    .from("profiles")
    .select("tier, tier_expires_at")
    .eq("id", ctx.user.id)
    .single();
  const limit = getProfileEntitlements(profile).proofingGalleries;
  if (limit === 0) return err("Proofing galleries are part of the Pro plan.");

  const active = await countActiveGalleries(ctx.supabase, ctx.user.id);
  if (active >= limit) {
    return err(
      `Your plan includes ${proofingLimitLabel(limit)} active galleries. Archive one to create another.`
    );
  }

  const { data, error } = await ctx.supabase
    .from("proofing_galleries")
    .insert({ user_id: ctx.user.id, title, slug: newProofingSlug() })
    .select("id")
    .single();
  if (error || !data) return err("Could not create the gallery. Try again.");

  revalidatePath("/proofing");
  return { ok: true, galleryId: data.id as string };
}

export async function renameProofingGallery(
  galleryId: string,
  rawTitle: string
): Promise<ActionResult> {
  const guard = await requireGallery(galleryId);
  if ("ok" in guard) return guard;
  const title = cleanTitle(rawTitle);
  if (!title) return err("Give the gallery a name.");
  const { error } = await guard.supabase
    .from("proofing_galleries")
    .update({ title })
    .eq("id", galleryId);
  if (error) return err("Could not rename the gallery.");
  revalidatePath("/proofing");
  revalidatePath(`/proofing/${galleryId}`);
  return { ok: true };
}

/** Set (or with null, remove) the gallery password. */
export async function setProofingPassword(
  galleryId: string,
  password: string | null
): Promise<ActionResult> {
  const guard = await requireGallery(galleryId);
  if ("ok" in guard) return guard;

  let password_hash: string | null = null;
  if (password !== null) {
    const check = validatePagePassword(password);
    if (!check.ok) return err(check.error ?? "That password will not work.");
    password_hash = await hashPagePassword(password);
  }

  const { error } = await guard.supabase
    .from("proofing_galleries")
    .update({ password_hash })
    .eq("id", galleryId);
  if (error) return err("Could not update the password.");
  revalidatePath(`/proofing/${galleryId}`);
  return { ok: true };
}

export async function setProofingStatus(
  galleryId: string,
  status: ProofingStatus
): Promise<ActionResult> {
  const guard = await requireGallery(galleryId);
  if ("ok" in guard) return guard;
  if (status === guard.gallery.status) return { ok: true };

  // Re-activating counts against the limit exactly like creating.
  if (status === "active") {
    const { data: profile } = await guard.supabase
      .from("profiles")
      .select("tier, tier_expires_at")
      .eq("id", guard.user.id)
      .single();
    const limit = getProfileEntitlements(profile).proofingGalleries;
    if (limit === 0) return err("Proofing galleries are part of the Pro plan.");
    const active = await countActiveGalleries(guard.supabase, guard.user.id);
    if (active >= limit) {
      return err(
        `Your plan includes ${proofingLimitLabel(limit)} active galleries. Archive one first.`
      );
    }
  }

  const { error } = await guard.supabase
    .from("proofing_galleries")
    .update({ status })
    .eq("id", galleryId);
  if (error) return err("Could not update the gallery.");
  revalidatePath("/proofing");
  revalidatePath(`/proofing/${galleryId}`);
  return { ok: true };
}

export async function deleteProofingGallery(galleryId: string): Promise<ActionResult> {
  const guard = await requireGallery(galleryId);
  if ("ok" in guard) return guard;

  // Collect storage paths first; rows cascade with the gallery. Removing
  // files in batches keeps each storage call comfortably sized.
  const { data: images } = await guard.supabase
    .from("proofing_images")
    .select("storage_path")
    .eq("gallery_id", galleryId);
  const paths = (images ?? []).flatMap((row) => {
    const md = row.storage_path as string;
    return [md, md.replace(/md\.jpg$/, "sm.jpg")];
  });
  for (let i = 0; i < paths.length; i += 200) {
    await guard.supabase.storage.from(MEDIA_BUCKET).remove(paths.slice(i, i + 200));
  }

  const { error } = await guard.supabase
    .from("proofing_galleries")
    .delete()
    .eq("id", galleryId);
  if (error) return err("Could not delete the gallery.");
  revalidatePath("/proofing");
  return { ok: true };
}

export async function removeProofingImage(imageId: string): Promise<ActionResult> {
  const ctx = await requireUser();
  if ("error" in ctx) return ctx;
  const { data } = await ctx.supabase
    .from("proofing_images")
    .select("id, user_id, gallery_id, storage_path")
    .eq("id", imageId)
    .single();
  if (!data || data.user_id !== ctx.user.id) return err("Photo not found.");

  const md = data.storage_path as string;
  await ctx.supabase.storage.from(MEDIA_BUCKET).remove([md, md.replace(/md\.jpg$/, "sm.jpg")]);
  const { error } = await ctx.supabase.from("proofing_images").delete().eq("id", imageId);
  if (error) return err("Could not remove the photo.");
  revalidatePath(`/proofing/${data.gallery_id}`);
  return { ok: true };
}

/** Reset the client's picks (e.g. before a second review round). */
export async function clearProofingSelections(galleryId: string): Promise<ActionResult> {
  const guard = await requireGallery(galleryId);
  if ("ok" in guard) return guard;
  const { error } = await guard.supabase
    .from("proofing_selections")
    .delete()
    .eq("gallery_id", galleryId);
  if (error) return err("Could not clear the selections.");
  revalidatePath(`/proofing/${galleryId}`);
  return { ok: true };
}

// ─── Anonymous client unlock ─────────────────────────────────────────

export async function unlockGallery(slug: string, password: string): Promise<ActionResult> {
  if (typeof slug !== "string" || typeof password !== "string" || password.length > 100) {
    return err("That password isn't right.");
  }

  const headerStore = await headers();
  const ip = clientIp(headerStore);
  const limited = rateLimit("proofing-unlock", `${ip}:${slug}`, 10, 60);
  if (!limited.allowed) return err("Too many attempts. Wait a minute and try again.");

  // Gallery rows are not anon-readable by design; service role + code checks.
  const admin = createAdminClient();
  const { data: gallery } = await admin
    .from("proofing_galleries")
    .select("id, status, password_hash")
    .eq("slug", slug)
    .single();
  if (!gallery || gallery.status !== "active" || !gallery.password_hash) {
    return err("That password isn't right.");
  }

  const valid = await verifyPagePassword(password, gallery.password_hash);
  if (!valid) return err("That password isn't right.");

  await grantGalleryAccess(gallery.id);
  return { ok: true };
}
