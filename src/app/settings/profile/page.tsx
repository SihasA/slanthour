import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";
import type { Profile } from "@/types";

export const metadata: Metadata = { title: "Profile settings · Slanthour" };

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  return (
    <div className="px-6 py-10 sm:py-14 max-w-xl">
      <h1 className="font-heading text-3xl italic font-light mb-2">Profile</h1>
      <p className="font-copy text-sm text-muted mb-10">
        How you appear on your public profile and pages.
      </p>
      <ProfileSettingsForm profile={profile as Profile} />
    </div>
  );
}
