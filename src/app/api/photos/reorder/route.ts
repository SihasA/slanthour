import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let items: Array<{ id: string; sort_order: number }>;

  try {
    const body = await request.json();
    items = body.items;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Update each photo's sort_order — RLS ensures only the owner can update
  const results = await Promise.all(
    items.map(({ id, sort_order }) =>
      supabase.from("photos").update({ sort_order }).eq("id", id)
    )
  );

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Some updates failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
