import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { ThemeSettings } from "@/components/dashboard/ThemeSettings";
import type { Profile, Theme } from "@/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: theme }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single(),
    supabase
      .from("themes")
      .select("*")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!profile || !theme) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 md:py-20">
      <p className="section-label mb-6">Settings</p>
      <h1 className="font-heading text-3xl md:text-4xl font-light italic text-foreground mb-12">
        Make it yours.
      </h1>

      {/* Profile section */}
      <section className="mb-16">
        <div className="flex items-center gap-5 mb-8">
          <span className="section-label whitespace-nowrap">Profile</span>
          <div className="flex-1 h-px bg-rule" />
        </div>
        <ProfileForm profile={profile as Profile} />
      </section>

      {/* Theme: layout picker + customize (colours/fonts) */}
      <ThemeSettings initialTheme={theme as Theme} tier={(profile as Profile).tier} />
    </div>
  );
}
