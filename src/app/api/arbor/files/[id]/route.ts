import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireArbor } from "@/lib/arbor/guard";

const SELECT = "id, collection_id, kind, title, filename, content, storage_path, mime_type, size_bytes, sort_order, created_at, updated_at, arbor_file_tags(tag_id)";

type RawFile = Record<string, unknown> & { arbor_file_tags?: { tag_id: string }[] };

function flatten(row: RawFile) {
  const { arbor_file_tags, ...rest } = row;
  return { ...rest, tag_ids: (arbor_file_tags ?? []).map((t) => t.tag_id) };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireArbor();
  if (denied) return denied;
  const { id } = await params;

  const supabase = createAdminClient();
  let tagIds: string[] | undefined;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  try {
    const body = await request.json();
    if (typeof body.title === "string") update.title = body.title.trim();
    if (typeof body.content === "string") update.content = body.content;
    if ("collection_id" in body) update.collection_id = body.collection_id || null;
    if (typeof body.sort_order === "number") update.sort_order = body.sort_order;
    if (Array.isArray(body.tag_ids)) tagIds = body.tag_ids.filter((t: unknown) => typeof t === "string");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (tagIds !== undefined) {
    await supabase.from("arbor_file_tags").delete().eq("file_id", id);
    if (tagIds.length > 0) {
      const { error: tagError } = await supabase
        .from("arbor_file_tags")
        .insert(tagIds.map((tag_id) => ({ file_id: id, tag_id })));
      if (tagError) return NextResponse.json({ error: tagError.message }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("arbor_files")
    .update(update)
    .eq("id", id)
    .select(SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ file: flatten(data as RawFile) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireArbor();
  if (denied) return denied;
  const { id } = await params;

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("arbor_files")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (existing?.storage_path) {
    await supabase.storage.from("arbor").remove([existing.storage_path]);
  }

  const { error } = await supabase.from("arbor_files").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
