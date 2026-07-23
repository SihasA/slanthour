import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getProfileEntitlements, resolveTier } from "@/lib/entitlements";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";
import type { Tier } from "@/types";

export const metadata: Metadata = { title: "Account settings · Slanthour" };

const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  hobby: "Hobby",
  pro: "Pro",
  studio: "Studio",
};

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const hasPasswordAuth = (user.identities ?? []).some((i) => i.provider === "email");

  const [{ data: profile }, { count: pageCount }, { count: grantCount }] = await Promise.all([
    supabase.from("profiles").select("tier, tier_expires_at").eq("id", user.id).single(),
    supabase.from("pages").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("permanent_grants")
      .select("page_id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);
  const tier = resolveTier(profile?.tier as Tier | undefined, profile?.tier_expires_at);
  const entitlements = getProfileEntitlements(profile);
  // Keepsake permanent-grant pages don't count against the plan limit, so
  // mirror countablePages() here or the display disagrees with enforcement.
  const countablePages = Math.max(0, (pageCount ?? 0) - (grantCount ?? 0));

  return (
    <div className="px-6 py-10 sm:py-14 max-w-xl">
      <h1 className="font-heading text-3xl italic font-light mb-2">Account</h1>
      <p className="font-copy text-sm text-muted mb-10">Sign-in and account management.</p>

      {/* ── Plan ── */}
      <section className="border border-rule p-6 mb-10">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <h2 className="text-[10px] uppercase tracking-wide text-muted">Plan</h2>
          <span className="font-heading italic text-xl font-light">{TIER_LABEL[tier]}</span>
        </div>
        <p className="font-copy text-[13px] text-muted leading-relaxed">
          {countablePages} of {entitlements.maxPages} pages · up to{" "}
          {entitlements.maxImagesPerPage} images per page
          {entitlements.hiFiUploads && " · high-fidelity uploads"}
        </p>
        {tier === "free" && (
          <p className="mt-3 font-copy text-[13px] text-muted/80 leading-relaxed">
            Paid plans are coming soon. Everything stays free while billing is being finished.{" "}
            <Link
              href="/pricing"
              className="underline underline-offset-2 hover:text-accent transition-colors"
            >
              See what they&apos;ll include
            </Link>
            .
          </p>
        )}
      </section>

      <TwoFactorSettings />

      <AccountSettings email={user.email ?? ""} hasPasswordAuth={hasPasswordAuth} />
    </div>
  );
}
