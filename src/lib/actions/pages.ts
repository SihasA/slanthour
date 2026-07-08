"use server";

// ─── Page mutations ──────────────────────────────────────────────────
// Every write goes through here (not browser → Supabase). Each action:
//   1. authenticates the caller,
//   2. loads the resource through the user-scoped client (RLS layer),
//   3. explicitly verifies ownership (application layer),
//   4. sanitises input before persisting.
// Actions return { ok } results instead of throwing across the boundary.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  collectAssetIds,
  countImages,
  createEmptyDocument,
  firstImage,
  newSectionId,
  parseDocument,
  sectionImages,
  withSectionImages,
  type PageDocument,
  type PublishedSnapshot,
} from "@/lib/page-document";
import { MEDIA_BUCKET } from "@/lib/constants";
import { getProfileEntitlements } from "@/lib/entitlements";
import { hashPagePassword } from "@/lib/page-password";
import {
  slugify,
  validatePagePassword,
  validateSlug,
  PAGE_TITLE_MAX_LENGTH,
} from "@/lib/validation";
import {
  DEFAULT_THEME,
  defaultThemeSettings,
  isThemeId,
  sanitizeThemeSettings,
} from "@/themes/registry";
import type { Page, Visibility } from "@/types";

export type ActionError = { ok: false; error: string; conflict?: boolean };
export type ActionOk<T> = { ok: true } & T;
export type ActionResult<T = object> = ActionOk<T> | ActionError;

const err = (error: string, conflict = false): ActionError => ({ ok: false, error, conflict });

// ─── Shared guards ───────────────────────────────────────────────────

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

type PageGuard = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string };
  page: Page;
};

/** Returns the guard context, or an ActionError (detectable via "ok" in result). */
async function requirePage(pageId: string): Promise<PageGuard | ActionError> {
  const ctx = await requireUser();
  if (!ctx) return err("Your session has expired. Sign in again.");
  const { data } = await ctx.supabase.from("pages").select("*").eq("id", pageId).single();
  const page = data as Page | null;
  // RLS already scopes reads, but ownership is asserted explicitly as well.
  if (!page || page.user_id !== ctx.user.id) return err("Page not found.");
  return { supabase: ctx.supabase, user: ctx.user, page };
}

async function ownerUsername(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("profiles").select("username").eq("id", userId).single();
  return (data?.username as string | undefined) ?? null;
}

function revalidatePublic(username: string | null, slug: string) {
  revalidatePath("/dashboard");
  if (username) {
    revalidatePath(`/${username}`);
    revalidatePath(`/${username}/${slug}`);
  }
}

/**
 * Pages that count against the plan limit. Keepsake (permanent-grant)
 * pages are bought outright and are exempt; grant rows cascade-delete
 * with their page, so the subtraction stays accurate.
 */
async function countablePages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const [{ count }, { data: grants }] = await Promise.all([
    supabase.from("pages").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("permanent_grants").select("page_id").eq("user_id", userId),
  ]);
  return Math.max(0, (count ?? 0) - (grants ?? []).length);
}

async function uniqueSlugFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  base: string
): Promise<string> {
  const candidate = base || "untitled";
  const { data } = await supabase
    .from("pages")
    .select("slug")
    .eq("user_id", userId)
    .like("slug", `${candidate}%`);
  const taken = new Set((data ?? []).map((row) => row.slug as string));
  if (!taken.has(candidate)) return candidate;
  for (let n = 2; n < 1000; n++) {
    const next = `${candidate.slice(0, 55)}-${n}`;
    if (!taken.has(next)) return next;
  }
  return `${candidate.slice(0, 40)}-${Date.now()}`;
}

// ─── Create / duplicate / delete ─────────────────────────────────────

export async function createPage(rawTitle: string): Promise<ActionResult<{ pageId: string }>> {
  const ctx = await requireUser();
  if (!ctx) return err("Your session has expired. Sign in again.");
  const { supabase, user } = ctx;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, tier_expires_at")
    .eq("id", user.id)
    .single();
  const entitlements = getProfileEntitlements(profile);

  if ((await countablePages(supabase, user.id)) >= entitlements.maxPages)
    return err(`Your plan allows ${entitlements.maxPages} pages. Delete one to create another.`);

  const title = (rawTitle || "Untitled").trim().slice(0, PAGE_TITLE_MAX_LENGTH) || "Untitled";
  let slugBase = slugify(title);
  if (!validateSlug(slugBase).ok) slugBase = "untitled";
  const slug = await uniqueSlugFor(supabase, user.id, slugBase);

  const { data, error } = await supabase
    .from("pages")
    .insert({
      user_id: user.id,
      slug,
      title,
      theme: DEFAULT_THEME,
      theme_settings: defaultThemeSettings(DEFAULT_THEME),
      draft: createEmptyDocument(),
    })
    .select("id")
    .single();

  if (error || !data) return err("Could not create the page. Try again.");
  revalidatePath("/dashboard");
  return { ok: true, pageId: data.id as string };
}

export async function duplicatePage(pageId: string): Promise<ActionResult<{ pageId: string }>> {
  const guard = await requirePage(pageId);
  if ("ok" in guard) return guard;
  const { supabase, user, page } = guard;

  const { data: profile } = await supabase
    .from("profiles").select("tier, tier_expires_at").eq("id", user.id).single();
  if ((await countablePages(supabase, user.id)) >= getProfileEntitlements(profile).maxPages)
    return err("Page limit reached. Delete a page before duplicating.");

  // Fresh section/image ids; assetIds intentionally shared (same underlying files).
  const doc = parseDocument(page.draft);
  const cloned: PageDocument = {
    version: doc.version,
    sections: doc.sections.map((section) => {
      const withNewId = { ...section, id: newSectionId() };
      const images = sectionImages(withNewId).map((img) => ({ ...img, id: newSectionId() }));
      return withSectionImages(withNewId, images);
    }),
  };

  const slug = await uniqueSlugFor(supabase, user.id, `${page.slug.slice(0, 50)}-copy`);
  const { data, error } = await supabase
    .from("pages")
    .insert({
      user_id: user.id,
      slug,
      title: `${page.title}`.slice(0, PAGE_TITLE_MAX_LENGTH),
      theme: page.theme,
      theme_settings: sanitizeThemeSettings(page.theme, page.theme_settings),
      draft: cloned,
      cover_path: page.cover_path,
      visibility: "public",
    })
    .select("id")
    .single();

  if (error || !data) return err("Could not duplicate the page.");
  revalidatePath("/dashboard");
  return { ok: true, pageId: data.id as string };
}

export async function deletePage(pageId: string): Promise<ActionResult> {
  const guard = await requirePage(pageId);
  if ("ok" in guard) return guard;
  const { supabase, user, page } = guard;

  // Assets this page's draft references — candidates for cleanup once the
  // page is gone, but only if no *other* page (e.g. a duplicate) still uses them.
  const candidateAssetIds = collectAssetIds(parseDocument(page.draft));

  const { error } = await supabase.from("pages").delete().eq("id", pageId).eq("user_id", user.id);
  if (error) return err("Could not delete the page.");

  if (candidateAssetIds.size > 0) await pruneOrphanedAssets(supabase, user.id, candidateAssetIds);

  revalidatePublic(await ownerUsername(supabase, user.id), page.slug);
  return { ok: true };
}

/** Delete media_assets (and their storage files) no longer referenced by any of the user's remaining pages. */
async function pruneOrphanedAssets(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  candidateAssetIds: Set<string>
): Promise<void> {
  const { data: remaining } = await supabase
    .from("pages")
    .select("draft, published")
    .eq("user_id", userId);

  const stillReferenced = new Set<string>();
  for (const row of remaining ?? []) {
    for (const id of collectAssetIds(parseDocument(row.draft))) stillReferenced.add(id);
    if (row.published) for (const id of collectAssetIds(parseDocument(row.published.document))) stillReferenced.add(id);
  }

  const orphanIds = [...candidateAssetIds].filter((id) => !stillReferenced.has(id));
  if (orphanIds.length === 0) return;

  const { data: assets } = await supabase
    .from("media_assets")
    .select("id, storage_path, has_variants, has_xl")
    .eq("user_id", userId)
    .in("id", orphanIds);

  const paths = (assets ?? []).flatMap((asset) =>
    asset.has_variants
      ? ["lg.jpg", "md.jpg", "sm.jpg", ...(asset.has_xl ? ["xl.jpg"] : [])].map((v) =>
          (asset.storage_path as string).replace(/lg\.jpg$/, v)
        )
      : [asset.storage_path as string]
  );
  if (paths.length > 0) await supabase.storage.from(MEDIA_BUCKET).remove(paths);
  await supabase.from("media_assets").delete().eq("user_id", userId).in("id", orphanIds);
}

// ─── Draft autosave ──────────────────────────────────────────────────

export interface SaveDraftInput {
  document: unknown;
  title: string;
  theme: string;
  themeSettings: unknown;
}

export async function savePageDraft(
  pageId: string,
  input: SaveDraftInput,
  baseRev: number
): Promise<ActionResult<{ rev: number }>> {
  const guard = await requirePage(pageId);
  if ("ok" in guard) return guard;
  const { supabase, user, page } = guard;

  const document = parseDocument(input.document);
  const theme = isThemeId(input.theme) ? input.theme : page.theme;
  const themeSettings = sanitizeThemeSettings(theme, input.themeSettings);
  const title = (input.title ?? "").trim().slice(0, PAGE_TITLE_MAX_LENGTH);

  const { data: profile } = await supabase
    .from("profiles").select("tier, tier_expires_at").eq("id", user.id).single();
  const entitlements = getProfileEntitlements(profile);
  if (countImages(document) > entitlements.maxImagesPerPage)
    return err(`Your plan allows ${entitlements.maxImagesPerPage} images per page.`);

  const cover = firstImage(document);
  const coverPath = cover && !cover.path.startsWith("http") ? cover.path : null;

  // Optimistic concurrency: only apply on top of the revision the client
  // saved against, so a stale response can never clobber newer changes.
  const { data, error } = await supabase
    .from("pages")
    .update({
      draft: document,
      title: title || "Untitled",
      theme,
      theme_settings: themeSettings,
      cover_path: coverPath,
      draft_rev: baseRev + 1,
    })
    .eq("id", pageId)
    .eq("user_id", user.id)
    .eq("draft_rev", baseRev)
    .select("draft_rev");

  if (error) return err("Could not save changes.");
  if (!data || data.length === 0)
    return err("This page was changed somewhere else. Reload to continue.", true);

  return { ok: true, rev: baseRev + 1 };
}

// ─── Publication settings ────────────────────────────────────────────

export interface PageSettingsInput {
  slug?: string;
  visibility?: Visibility;
  /** New password (only when visibility is "password"); empty = keep existing. */
  password?: string;
}

export async function updatePageSettings(
  pageId: string,
  input: PageSettingsInput
): Promise<ActionResult<{ slug: string }>> {
  const guard = await requirePage(pageId);
  if ("ok" in guard) return guard;
  const { supabase, user, page } = guard;

  const updates: Record<string, unknown> = {};

  if (input.slug !== undefined && input.slug !== page.slug) {
    const check = validateSlug(input.slug);
    if (!check.ok) return err(check.error ?? "Invalid link name.");
    updates.slug = input.slug;
  }

  if (input.visibility !== undefined) {
    if (!["public", "unlisted", "password"].includes(input.visibility))
      return err("Invalid visibility.");
    updates.visibility = input.visibility;
  }

  const visibility = (updates.visibility ?? page.visibility) as Visibility;
  if (visibility === "password") {
    if (input.password) {
      const check = validatePagePassword(input.password);
      if (!check.ok) return err(check.error ?? "Invalid password.");
      updates.password_hash = await hashPagePassword(input.password);
    } else if (!page.password_hash) {
      return err("Set a password for this page.");
    }
  }

  if (Object.keys(updates).length === 0) return { ok: true, slug: page.slug };

  const { error } = await supabase
    .from("pages")
    .update(updates)
    .eq("id", pageId)
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") return err("You already have a page with that link name.");
    return err("Could not update page settings.");
  }

  const username = await ownerUsername(supabase, user.id);
  revalidatePublic(username, page.slug);
  if (updates.slug) revalidatePublic(username, updates.slug as string);
  return { ok: true, slug: (updates.slug as string) ?? page.slug };
}

// ─── Publish / unpublish ─────────────────────────────────────────────

export async function publishPage(pageId: string): Promise<ActionResult<{ url: string }>> {
  const guard = await requirePage(pageId);
  if ("ok" in guard) return guard;
  const { supabase, user, page } = guard;

  const document = parseDocument(page.draft);
  if (!page.title.trim()) return err("Give the page a title before publishing.");
  if (document.sections.length === 0) return err("Add at least one section before publishing.");
  if (page.visibility === "password" && !page.password_hash)
    return err("Set a password before publishing a protected page.");

  const { data: profile } = await supabase
    .from("profiles").select("tier, tier_expires_at, username").eq("id", user.id).single();
  if (!getProfileEntitlements(profile).canPublish)
    return err("Your plan does not include publishing.");

  const snapshot: PublishedSnapshot = {
    snapshotVersion: 1,
    document,
    theme: page.theme,
    themeSettings: sanitizeThemeSettings(page.theme, page.theme_settings),
    title: page.title,
    publishedAt: new Date().toISOString(),
  };

  // Single-row UPDATE — the previous snapshot is replaced atomically.
  const { error } = await supabase
    .from("pages")
    .update({ published: snapshot, published_at: snapshot.publishedAt, is_published: true })
    .eq("id", pageId)
    .eq("user_id", user.id);

  if (error) return err("Could not publish. Try again.");

  const username = profile?.username ?? (await ownerUsername(supabase, user.id));
  revalidatePublic(username, page.slug);
  return { ok: true, url: `/${username}/${page.slug}` };
}

export async function unpublishPage(pageId: string): Promise<ActionResult> {
  const guard = await requirePage(pageId);
  if ("ok" in guard) return guard;
  const { supabase, user, page } = guard;

  const { error } = await supabase
    .from("pages")
    .update({ is_published: false, published: null, published_at: null })
    .eq("id", pageId)
    .eq("user_id", user.id);

  if (error) return err("Could not unpublish.");
  revalidatePublic(await ownerUsername(supabase, user.id), page.slug);
  return { ok: true };
}

// ─── Slug availability (editor feedback) ─────────────────────────────

export async function checkSlugAvailable(
  pageId: string,
  slug: string
): Promise<ActionResult<{ available: boolean }>> {
  const guard = await requirePage(pageId);
  if ("ok" in guard) return guard;
  const { supabase, user } = guard;

  const check = validateSlug(slug);
  if (!check.ok) return err(check.error ?? "Invalid link name.");

  const { data } = await supabase
    .from("pages")
    .select("id")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .neq("id", pageId)
    .limit(1);

  return { ok: true, available: (data ?? []).length === 0 };
}
