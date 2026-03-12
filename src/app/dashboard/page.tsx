import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-rule">
        <Link
          href="/dashboard"
          className="font-heading text-xl italic font-light tracking-tight text-foreground"
        >
          Slant Hour
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-[10px] uppercase tracking-wide text-muted">
            {user.email}
          </span>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-[10px] uppercase tracking-wide text-accent hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Empty state */}
      <div className="max-w-[600px] mx-auto px-6 py-32 text-center">
        <p className="section-label mb-6">Dashboard</p>
        <h1 className="font-heading text-3xl font-light italic text-foreground mb-4">
          Welcome to Slant Hour.
        </h1>
        <p className="font-heading text-[17px] italic text-muted leading-relaxed">
          Your portfolio is being set up. Photo uploads, theme customisation,
          and portfolio editing are coming in Phase 2 &amp; 3.
        </p>
      </div>
    </div>
  );
}
