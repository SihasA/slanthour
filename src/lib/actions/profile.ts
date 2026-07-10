"use server";

// ─── Profile mutations ───────────────────────────────────────────────

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateUsername } from "@/lib/validation";
import { pageCacheTag } from "@/lib/page-cache";
import type { ActionResult } from "./pages";

const DISPLAY_NAME_MAX = 60;
const BIO_MAX = 400;

export interface ProfileInput {
  display_name: string;
  username: string;
  bio: string;
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

  const { data: current } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  if (!current) return { ok: false, error: "Profile not found." };

  const updates: Record<string, unknown> = { display_name, bio, updated_at: new Date().toISOString() };

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

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarPath, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { ok: false, error: "Could not update your photo." };

  revalidatePath("/dashboard");
  return { ok: true };
}
