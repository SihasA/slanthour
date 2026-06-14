import { NextResponse } from "next/server";
import {
  checkPassword,
  createSessionToken,
  ARBOR_COOKIE,
  ARBOR_COOKIE_MAX_AGE,
} from "@/lib/arbor/auth";

export async function POST(request: Request) {
  let password: string;
  try {
    const body = await request.json();
    password = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof password !== "string" || !checkPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ARBOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ARBOR_COOKIE_MAX_AGE,
  });
  return response;
}
