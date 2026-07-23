"use server";

// ─── Profile mutations ───────────────────────────────────────────────

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateUsername } from "@/lib/validation";
import { normalizeWebsiteUrl, normalizeInstagramHandle, normalizeEmail } from "@/lib/links";
import { pageCacheTag, profileCacheTag } from "@/lib/page-cache";
import type { ActionResult } from "./pages";

const DISPLAY_NAME_MAX = 60;
const BIO_MAX = 400;

export interface ProfileInput {
  display_name: string;
  username: string;
  bio: string;
  // Opt-in contact fields. Empty string clears the field (nothing public).
  website_url: string;
  instagram_handle: string;
  // The public contact email. Empty string means "do not show an email".
  email_public: string;
}

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };

  const display_name = input.display_name.trim().slice(0, DISPLAY_NAME_MAX);
  if (!display_name) return { ok: false, error: "A display name is required." };
  const bio = input.bio.trim().slice(0, BIO_MAX);
  const username = input.username.trim().toLowerCase();

  // Opt-in contact fields: validate server-side (authoritative). An empty
  // value clears the field so nothing is exposed; an invalid value is
  // rejected outright rather than silently dropped, so the owner knows.
  const rawWebsite = (input.website_url ?? "").trim();
  const website_url = rawWebsite ? normalizeWebsiteUrl(rawWebsite) : null;
  if (rawWebsite && !website_url)
    return { ok: false, error: "That website link is not a valid http(s) address." };

  const rawInstagram = (input.instagram_handle ?? "").trim();
  const instagram_handle = rawInstagram ? normalizeInstagramHandle(rawInstagram) : null;
  if (rawInstagram && !instagram_handle)
    return { ok: false, error: "That Instagram handle uses characters that are not allowed." };

  const rawEmail = (input.email_public ?? "").trim();
  const email_public = rawEmail ? normalizeEmail(rawEmail) : null;
  if (rawEmail && !email_public)
    return { ok: false, error: "That contact email does not look valid." };

  const { data: current } = await supabase
    .from("profiles")
    .select("username, display_name, bio, website_url, instagram_handle, email_public")
    .eq("id", user.id)
    .single();
  if (!current) return { ok: false, error: "Profile not found." };
  const displayNameChanged = display_name !== current.display_name;
  const bioChanged = bio !== (current.bio ?? "");
  const contactChanged =
    website_url !== current.website_url ||
    instagram_handle !== current.instagram_handle ||
    email_public !== current.email_public;

  const updates: Record<string, unknown> = {
    display_name,
    bio,
    website_url,
    instagram_handle,
    email_public,
    updated_at: new Date().toISOString(),
  };

  if (username !== current.username) {
    const check = validateUsername(username);
    if (!check.ok) return { ok: false, error: check.error ?? "Invalid username." };
    updates.username = username;
    updates.username_changed_at = new Date().toISOString();
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That username is taken." };
    return { ok: false, error: "Could not save your profile." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${current.username}`);

  if (updates.username) {
    revalidatePath(`/${username}`);
    // The profile itself moves to a new URL — invalidate both the old and
    // new address, or the old one keeps serving a stale grid and the new
    // one stays a 404-until-revalidate for up to an hour.
    revalidateTag(profileCacheTag(current.username));
    revalidateTag(profileCacheTag(username));
    // Every one of this user's page URLs moves with the username, so each
    // page's cache entry must be invalidated at both its old and new
    // address — a single revalidatePath("/[username]") does not reach the
    // per-page tag on /[username]/[slug].
    const { data: pages } = await supabase.from("pages").select("slug").eq("user_id", user.id);
    for (const row of pages ?? []) {
      const slug = row.slug as string;
      revalidateTag(pageCacheTag(current.username, slug));
      revalidateTag(pageCacheTag(username, slug));
      revalidatePath(`/${current.username}/${slug}`);
      revalidatePath(`/${username}/${slug}`);
    }
  } else if (displayNameChanged || bioChanged || contactChanged) {
    // The profile header (name/bio) and the opt-in contact links are
    // rendered from the cached profile read, so any of these changes must
    // invalidate the profile tag or the old value lingers up to an hour.
    revalidateTag(profileCacheTag(current.username));
    if (displayNameChanged || contactChanged) {
      // The display name and the opt-in contact links are also rendered on
      // every published page (tab/OG title, author, footer) from the cached
      // snapshot join, so those changes must invalidate each page's tag too.
      const { data: pages } = await supabase.from("pages").select("slug").eq("user_id", user.id);
      for (const row of pages ?? []) {
        revalidateTag(pageCacheTag(current.username, row.slug as string));
      }
    }
  }

  return { ok: true };
}

export async function updateAvatar(avatarPath: string | null): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };

  // Only accept paths inside the caller's own storage folder.
  if (avatarPath !== null && !avatarPath.startsWith(`${user.id}/`))
    return { ok: false, error: "Invalid avatar path." };

  const { data: current } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarPath, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { ok: false, error: "Could not update your photo." };

  revalidatePath("/dashboard");
  // The avatar renders in the profile header from the cached profile read.
  if (current?.username) revalidateTag(profileCacheTag(current.username));
  return { ok: true };
}
