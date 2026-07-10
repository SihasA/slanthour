// ─── View beacon ──────────────────────────────────────────────────────
// Fired once per page load from the client (ViewBeacon.tsx), which is
// rendered only after a password-protected page's gate has already
// passed — a locked view never reaches this endpoint. Preserves the
// render-path recording semantics it replaces: bot filter, owner
// exclusion, and zero DB reads for signed-out visitors, with a rate
// limit added since this endpoint is now reachable directly.
//
// Always responds 204: success, bot, invalid id, rate-limited, and an
// owner viewing their own page all look identical from the outside, so
// nothing about a page's view state can be probed from the response.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { isBotUserAgent } from "@/lib/analytics";
import { parseBeaconBody } from "@/lib/view-beacon";

export const runtime = "nodejs";

function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: Request) {
  if (isBotUserAgent(request.headers.get("user-agent") ?? "")) return noContent();

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return noContent();
  }
  const pageId = parseBeaconBody(raw);
  if (!pageId) return noContent();

  const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const limited = rateLimit("page-view", `${ip}:${pageId}`, 20, 60);
  if (!limited.allowed) return noContent();

  // Signed-out visitors (the common case) skip the auth round-trip entirely.
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const admin = createAdminClient();
      const { data: page } = await admin
        .from("pages")
        .select("user_id")
        .eq("id", pageId)
        .single();
      if (page?.user_id === user.id) return noContent();
    }
  }

  const admin = createAdminClient();
  await admin.rpc("increment_page_view", { p_page_id: pageId });
  return noContent();
}
