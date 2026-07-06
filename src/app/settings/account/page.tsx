import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AccountSettings } from "@/components/settings/AccountSettings";

export const metadata: Metadata = { title: "Account settings — Slanthour" };

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const hasPasswordAuth = (user.identities ?? []).some((i) => i.provider === "email");

  return (
    <div className="px-6 py-10 sm:py-14 max-w-xl">
      <h1 className="font-heading text-3xl italic font-light mb-2">Account</h1>
      <p className="font-copy text-sm text-muted mb-10">Sign-in and account management.</p>
      <AccountSettings email={user.email ?? ""} hasPasswordAuth={hasPasswordAuth} />
    </div>
  );
}
