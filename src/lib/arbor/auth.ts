// Shared-password gate for /arborAI.
//
// A single password (ARBOR_PASSWORD) unlocks the page. On success we set a
// signed, HttpOnly cookie containing only an expiry — verified via HMAC with
// ARBOR_SESSION_SECRET. Uses Web Crypto so it works in both the Edge and Node
// runtimes. No Supabase auth user is involved.

import { cookies } from "next/headers";

export const ARBOR_COOKIE = "arbor_session";
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const encoder = new TextEncoder();

function b64urlEncode(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(input: string): string {
  let str = input.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return b64urlEncode(new Uint8Array(sig));
}

function getSecret(): string {
  const secret = process.env.ARBOR_SESSION_SECRET;
  if (!secret) throw new Error("ARBOR_SESSION_SECRET is not set");
  return secret;
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ARBOR_PASSWORD;
  if (!expected) throw new Error("ARBOR_PASSWORD is not set");
  return timingSafeEqual(input, expected);
}

export async function createSessionToken(): Promise<string> {
  const exp = Date.now() + TTL_SECONDS * 1000;
  const payload = b64urlEncode(encoder.encode(JSON.stringify({ exp })));
  const sig = await sign(payload, getSecret());
  return `${payload}.${sig}`;
}

async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = await sign(payload, getSecret());
  if (!timingSafeEqual(sig, expected)) return false;
  try {
    const { exp } = JSON.parse(b64urlDecode(payload));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

// Reads the cookie from the incoming request and returns whether the
// visitor has unlocked the gate. Use in server components and route handlers.
export async function isArborAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ARBOR_COOKIE)?.value);
}

export const ARBOR_COOKIE_MAX_AGE = TTL_SECONDS;
