import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireArbor } from "@/lib/arbor/guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireArbor();
  if (denied) return denied;
  const { id } = await params;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  try {
    const body = await request.json();
    if (typeof body.name === "string") update.name = body.name.trim();
    if (typeof body.description === "string") update.description = body.description.trim() || null;
    if (typeof body.sort_order === "number") update.sort_order = body.sort_order;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("arbor_collections")
    .update(update)
    .eq("id", id)
    .select("id, name, description, sort_order")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collection: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireArbor();
  if (denied) return denied;
  const { id } = await params;

  const supabase = createAdminClient();
  // Files keep existing; their collection_id is set null by the FK rule.
  const { error } = await supabase.from("arbor_collections").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
