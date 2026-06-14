import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireArbor } from "@/lib/arbor/guard";
import type { ArborKind } from "@/lib/arbor/types";

const SELECT = "id, collection_id, kind, title, filename, content, storage_path, mime_type, size_bytes, sort_order, created_at, updated_at, arbor_file_tags(tag_id)";

type RawFile = Record<string, unknown> & { arbor_file_tags?: { tag_id: string }[] };

function flatten(row: RawFile) {
  const { arbor_file_tags, ...rest } = row;
  return { ...rest, tag_ids: (arbor_file_tags ?? []).map((t) => t.tag_id) };
}

export async function GET() {
  const denied = await requireArbor();
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("arbor_files")
    .select(SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ files: (data as RawFile[]).map(flatten) });
}

export async function POST(request: Request) {
  const denied = await requireArbor();
  if (denied) return denied;

  const supabase = createAdminClient();
  const contentType = request.headers.get("content-type") ?? "";

  // ── Uploaded binary (pdf / image) ──────────────────────────────────
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const mime = file.type || "application/octet-stream";
    let kind: ArborKind;
    if (mime === "application/pdf") kind = "pdf";
    else if (mime.startsWith("image/")) kind = "image";
    else return NextResponse.json({ error: "Only PDF and image files are supported" }, { status: 400 });

    const collectionId = (form.get("collection_id") as string) || null;
    const title = ((form.get("title") as string) || file.name).trim();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${crypto.randomUUID()}-${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("arbor")
      .upload(storagePath, buffer, { contentType: mime, upsert: false });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data, error } = await supabase
      .from("arbor_files")
      .insert({
        collection_id: collectionId,
        kind,
        title,
        filename: file.name,
        storage_path: storagePath,
        mime_type: mime,
        size_bytes: file.size,
      })
      .select(SELECT)
      .single();

    if (error) {
      await supabase.storage.from("arbor").remove([storagePath]);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ file: flatten(data as RawFile) });
  }

  // ── Inline markdown ────────────────────────────────────────────────
  let title: string;
  let content: string;
  let collectionId: string | null = null;
  try {
    const body = await request.json();
    title = (body.title ?? "").trim();
    content = body.content ?? "";
    if (typeof body.collection_id === "string") collectionId = body.collection_id || null;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("arbor_files")
    .insert({ collection_id: collectionId, kind: "markdown", title, content })
    .select(SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ file: flatten(data as RawFile) });
}
