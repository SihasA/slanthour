import { NextResponse } from "next/server";
import { isArborAuthed } from "@/lib/arbor/auth";

// Returns a 401 response if the request is not behind the gate, otherwise null.
export async function requireArbor(): Promise<NextResponse | null> {
  if (await isArborAuthed()) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
