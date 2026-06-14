import { NextResponse } from "next/server";
import { ARBOR_COOKIE } from "@/lib/arbor/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ARBOR_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
