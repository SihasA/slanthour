// ─── Media deletion endpoint ─────────────────────────────────────────
// Deletes an asset the caller owns — unless a PUBLISHED snapshot still
// references it (deleting would break a live page). Draft references are
// allowed to break (the editor shows a missing-image placeholder), and the
// reference scan covers duplicated pages because it checks every page the
// user owns, not just the one the delete came from.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET } from "@/lib/constants";
import { collectAssetIds, parseDocument } from "@/lib/page-document";
import type { Page } from "@/types";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: asset } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .single();
  if (!asset || asset.user_id !== user.id) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, draft, published, is_published")
    .eq("user_id", user.id);

  for (const page of (pages ?? []) as Pick<Page, "id" | "title" | "draft" | "published" | "is_published">[]) {
    if (page.is_published && page.published) {
      const publishedIds = collectAssetIds(parseDocument(page.published.document));
      if (publishedIds.has(id)) {
        return NextResponse.json(
          { error: `This image is on the published page “${page.title}”. Unpublish or republish without it first.` },
          { status: 409 }
        );
      }
    }
  }

  // Remove all stored files for the asset (variants or the legacy single file).
  const paths = asset.has_variants
    ? ["lg.jpg", "md.jpg", "sm.jpg", ...(asset.has_xl ? ["xl.jpg"] : [])].map((v) =>
        (asset.storage_path as string).replace(/lg\.jpg$/, v)
      )
    : [asset.storage_path as string];
  await supabase.storage.from(MEDIA_BUCKET).remove(paths);

  const { error } = await supabase
    .from("media_assets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Could not delete the image." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
