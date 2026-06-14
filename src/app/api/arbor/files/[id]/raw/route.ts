import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireArbor } from "@/lib/arbor/guard";

// Streams a private bucket object to the gated client so <img> / <iframe>
// can render it same-origin without exposing a public URL.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireArbor();
  if (denied) return denied;
  const { id } = await params;

  const supabase = createAdminClient();
  const { data: file, error } = await supabase
    .from("arbor_files")
    .select("storage_path, mime_type, filename")
    .eq("id", id)
    .single();

  if (error || !file?.storage_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: blob, error: dlError } = await supabase.storage
    .from("arbor")
    .download(file.storage_path);
  if (dlError || !blob) {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }

  const disposition = new URL(request.url).searchParams.get("download") === "1"
    ? `attachment; filename="${file.filename ?? "file"}"`
    : "inline";

  return new NextResponse(blob.stream(), {
    headers: {
      "Content-Type": file.mime_type ?? "application/octet-stream",
      "Content-Disposition": disposition,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
