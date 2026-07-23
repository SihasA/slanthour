import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { needsMfaChallenge } from "@/lib/auth/mfa";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // If an auth code landed on the home page (Supabase fallback), forward it to the callback route
  if (path === "/" && request.nextUrl.searchParams.get("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/auth/callback";
    return NextResponse.redirect(url);
  }

  // The home page reads no auth state, so it shouldn't block on Supabase —
  // a slow or unavailable auth API must never take the marketing page down.
  if (path === "/") {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth token — important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect authenticated application routes. keepsake-view is an internal
  // render page the archive export self-fetches (src/lib/keepsake/
  // render.ts) — it re-checks ownership itself, but it must never be
  // reachable signed out either.
  const isProtected = ["/dashboard", "/editor", "/settings", "/pages", "/keepsake-view"].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // A signed-in user with a verified second factor whose session is still at
  // aal1 has not completed their 2FA challenge. Check assurance once, so we
  // can both block protected routes and keep /login reachable for them.
  let pendingMfaChallenge = false;
  if (user) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    pendingMfaChallenge = !!aal && needsMfaChallenge(aal.currentLevel, aal.nextLevel);
  }

  // 2FA enforcement: don't let direct navigation reach protected app routes
  // before the challenge is cleared. Send them to /login, where the AuthForm
  // challenge completes. /login stays reachable below, so this can't loop.
  if (user && isProtected && pendingMfaChallenge) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Signed-in users skip the auth pages, but a user still owing a 2FA
  // challenge MUST be able to reach /login to complete it, so exempt them.
  if (
    user &&
    !pendingMfaChallenge &&
    ["/login", "/signup", "/forgot-password"].includes(path)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/editor/:path*",
    "/settings/:path*",
    "/pages/:path*",
    "/keepsake-view/:path*",
    "/login",
    "/signup",
    "/forgot-password",
  ],
};
