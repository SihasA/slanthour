import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireArbor } from "@/lib/arbor/guard";

export async function GET() {
  const denied = await requireArbor();
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("arbor_collections")
    .select("id, name, description, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collections: data });
}

export async function POST(request: Request) {
  const denied = await requireArbor();
  if (denied) return denied;

  let name: string;
  let description: string | null = null;
  try {
    const body = await request.json();
    name = (body.name ?? "").trim();
    if (typeof body.description === "string") description = body.description.trim() || null;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("arbor_collections")
    .insert({ name, description })
    .select("id, name, description, sort_order")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collection: data });
}
