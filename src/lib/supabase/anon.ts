import { createClient } from "@supabase/supabase-js";

// Anon-key client with no cookie/session plumbing. The cookie-based client
// in server.ts calls next/headers cookies(), and Next.js forbids reading a
// dynamic API like cookies() inside a function wrapped in unstable_cache
// ("Route ... used cookies inside a function cached with unstable_cache").
// This client carries no request-scoped state, so it's safe to call from
// inside a cached read. RLS is still enforced via the anon key, so it only
// ever sees what an anonymous visitor could see — for reads that don't
// depend on who's asking (e.g. a public profile's published pages), that's
// identical to what the cookie-based client would have returned anyway.
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
