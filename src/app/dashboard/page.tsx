import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Portfolio } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: portfolio }, { data: photos }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, username")
        .eq("id", user.id)
        .single(),
      supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("photos")
        .select("id")
        .eq("user_id", user.id),
    ]);

  if (!profile || !portfolio) redirect("/login");

  const photoCount = photos?.length ?? 0;
  const isPublished = (portfolio as Portfolio).is_published;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 md:py-20">
      <p className="section-label mb-6">Dashboard</p>
      <h1 className="font-heading text-3xl md:text-4xl font-light italic text-foreground mb-12">
        Welcome, {profile.display_name.split(" ")[0]}.
      </h1>

      {/* Portfolio status */}
      <section className="mb-16">
        <div className="flex items-center gap-5 mb-8">
          <span className="section-label whitespace-nowrap">Portfolio</span>
          <div className="flex-1 h-px bg-rule" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            label="Status"
            value={isPublished ? "Published" : "Draft"}
            accent={isPublished}
          />
          <Card label="Photos" value={String(photoCount)} />
        </div>

        <div className="mt-8 flex flex-wrap gap-6">
          <Link
            href={`/${profile.username}`}
            className="inline-flex items-center gap-3 text-[10px] uppercase tracking-wide text-foreground border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-all duration-200"
          >
            View portfolio <span className="text-sm">&rarr;</span>
          </Link>
        </div>
      </section>

      {/* Quick links */}
      <section>
        <div className="flex items-center gap-5 mb-8">
          <span className="section-label whitespace-nowrap">Quick links</span>
          <div className="flex-1 h-px bg-rule" />
        </div>

        <div className="flex flex-col gap-3">
          <QuickLink href="/dashboard/settings" label="Edit profile" />
          <QuickLink href="/dashboard/settings#theme" label="Customise theme" />
        </div>
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="border border-rule px-5 py-4">
      <p className="text-[9px] uppercase tracking-label text-accent mb-1">
        {label}
      </p>
      <p
        className={`font-heading text-xl italic ${
          accent ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3 border border-rule hover:border-muted transition-colors group"
    >
      <span className="text-[10px] uppercase tracking-wide text-muted group-hover:text-foreground transition-colors">
        {label}
      </span>
      <span className="text-muted group-hover:text-accent transition-colors">
        &rarr;
      </span>
    </Link>
  );
}
