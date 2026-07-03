// ─── Password-protected page access gate ─────────────────────────────
// After a visitor enters the correct page password, we set a signed,
// HttpOnly, time-limited cookie scoped to that page id (same HMAC pattern
// as the proven Arbor gate, generalised to carry a page id). Token payload
// is { pageId, exp } — no user data, nothing sensitive.

import { cookies } from "next/headers";

const TTL_SECONDS = 60 * 60 * 12; // 12 hours

const encoder = new TextEncoder();

export function pageGateCookieName(pageId: string): string {
  // One cookie per page so unlocking one page never unlocks another.
  return `sh_gate_${pageId.replace(/[^a-zA-Z0-9-]/g, "")}`;
}

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
  // Dedicated secret preferred; otherwise derive from the service key so the
  // feature works without extra setup. Rotating the service key simply
  // invalidates outstanding gate cookies (visitors re-enter the password).
  const secret = process.env.PAGE_GATE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("PAGE_GATE_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is not set");
  return `page-gate:${secret}`;
}

// ─── Token functions (pure — unit-testable with an injected secret) ──

export async function createGateToken(pageId: string, secret: string, now = Date.now()): Promise<string> {
  const payload = b64urlEncode(
    encoder.encode(JSON.stringify({ pageId, exp: now + TTL_SECONDS * 1000 }))
  );
  const sig = await sign(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifyGateToken(
  token: string | undefined,
  pageId: string,
  secret: string,
  now = Date.now()
): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = await sign(payload, secret);
  if (!timingSafeEqual(sig, expected)) return false;
  try {
    const parsed = JSON.parse(b64urlDecode(payload));
    return parsed.pageId === pageId && typeof parsed.exp === "number" && parsed.exp > now;
  } catch {
    return false;
  }
}

// ─── Cookie helpers (server components / actions / route handlers) ──

export async function grantPageAccess(pageId: string): Promise<void> {
  const store = await cookies();
  store.set(pageGateCookieName(pageId), await createGateToken(pageId, getSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TTL_SECONDS,
    path: "/",
  });
}

export async function hasPageAccess(pageId: string): Promise<boolean> {
  const store = await cookies();
  const token = store.get(pageGateCookieName(pageId))?.value;
  return verifyGateToken(token, pageId, getSecret());
}
