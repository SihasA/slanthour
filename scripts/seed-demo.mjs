// ─── Demo seed ───────────────────────────────────────────────────────
// Creates (idempotently) a demo user with one published page, built from
// the repo-owned photographs in public/demo/. Gives a fresh environment
// something real to render at /demo/north.
//
//   node --env-file=.env.local scripts/seed-demo.mjs
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. The page
// references /demo/*.jpg static paths directly (see src/lib/media.ts,
// which passes absolute paths through) — no storage upload required.

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Run with: node --env-file=.env.local scripts/seed-demo.mjs");
  process.exit(1);
}

const DEMO_EMAIL = "demo@slanthour.com";
const DEMO_PASSWORD = "demo-password-change-me";
const USERNAME = "demo";
const SLUG = "north";

const admin = createClient(URL, KEY, { auth: { persistSession: false } });

let idCounter = 0;
const uid = (p) => `demo-${p}-${idCounter++}`;

const image = (n, caption = "", portrait = false) => ({
  id: uid("img"),
  assetId: null,
  path: `/demo/photo-${n}.jpg`,
  hasVariants: false,
  width: portrait ? 600 : 900,
  height: portrait ? 900 : 600,
  alt: caption || "Demonstration photograph",
  caption,
  blur: null,
  focal: null,
});

const document = {
  version: 1,
  sections: [
    { id: uid("s"), type: "hero", image: image(2), title: "Fourteen Days North", subtitle: "A road trip in photographs", height: "half" },
    { id: uid("s"), type: "text", body: "We left before sunrise with two cameras, a paper map, and no plan worth the name. What follows is everything worth keeping.", align: "left" },
    { id: uid("s"), type: "split", images: [image(1, "Day two, first light"), image(6, "The long climb", true)] },
    { id: uid("s"), type: "heading", title: "The coast road", subtitle: "Days five to nine", level: 1 },
    { id: uid("s"), type: "row", images: [image(3, "Harbour"), image(4, "Interval"), image(5, "Low tide")] },
    { id: uid("s"), type: "quote", text: "The best photographs were the ones we almost didn't stop for.", attribution: "Trip notes" },
    { id: uid("s"), type: "grid", images: [image(7, "North field"), image(8, "Last evening"), image(1), image(5)], columns: 2, gap: "regular" },
  ],
};

const TITLE = "Fourteen Days North";
const THEME = "monograph";

async function findUserByEmail(email) {
  // Paginate defensively in case the project has many users.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  // 1. User (idempotent) — the signup trigger creates the profile row.
  let user = await findUserByEmail(DEMO_EMAIL);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Demo" },
    });
    if (error) throw error;
    user = data.user;
    console.log(`Created demo user ${user.id}`);
  } else {
    console.log(`Reusing demo user ${user.id}`);
  }

  // 2. Profile — ensure the stable username/display_name/bio.
  const { error: pErr } = await admin
    .from("profiles")
    .update({ username: USERNAME, display_name: "Demo", bio: "A demonstration profile for Slanthour." })
    .eq("id", user.id);
  if (pErr) throw pErr;

  // 3. Page — draft + frozen published snapshot, published + public.
  const now = new Date().toISOString();
  const snapshot = { snapshotVersion: 1, document, theme: THEME, themeSettings: {}, title: TITLE, cover: null, publishedAt: now };
  const row = {
    user_id: user.id,
    slug: SLUG,
    title: TITLE,
    theme: THEME,
    theme_settings: {},
    draft: document,
    draft_rev: 1,
    published: snapshot,
    published_at: now,
    is_published: true,
    visibility: "public",
    cover_path: "/demo/photo-2.jpg",
    updated_at: now,
  };

  const { data: existing } = await admin
    .from("pages")
    .select("id")
    .eq("user_id", user.id)
    .eq("slug", SLUG)
    .maybeSingle();

  if (existing) {
    const { error } = await admin.from("pages").update(row).eq("id", existing.id);
    if (error) throw error;
    console.log(`Updated demo page ${existing.id}`);
  } else {
    const { data, error } = await admin.from("pages").insert(row).select("id").single();
    if (error) throw error;
    console.log(`Created demo page ${data.id}`);
  }

  console.log(`\nDone. View at:  /${USERNAME}/${SLUG}`);
  console.log(`Sign in:        ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message ?? e);
  process.exit(1);
});
