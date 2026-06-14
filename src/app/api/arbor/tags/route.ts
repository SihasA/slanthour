import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireArbor } from "@/lib/arbor/guard";

export async function GET() {
  const denied = await requireArbor();
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("arbor_tags")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tags: data });
}

export async function POST(request: Request) {
  const denied = await requireArbor();
  if (denied) return denied;

  let name: string;
  try {
    const body = await request.json();
    name = (body.name ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const supabase = createAdminClient();
  // Upsert so re-adding an existing tag returns it instead of erroring.
  const { data, error } = await supabase
    .from("arbor_tags")
    .upsert({ name }, { onConflict: "name" })
    .select("id, name")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tag: data });
}
