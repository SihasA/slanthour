import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PhotoGrid } from "@/components/dashboard/PhotoGrid";
import { PortfolioSettings } from "@/components/dashboard/PortfolioSettings";
import { BannerUpload } from "@/components/dashboard/BannerUpload";
import type { Portfolio, Photo, Tier } from "@/types";
import { TIER_LIMITS } from "@/lib/constants";

export default async function PortfolioEditorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile (for tier) and portfolio in parallel
  const [{ data: profile }, { data: portfolio }] = await Promise.all([
    supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .single(),
    supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!profile || !portfolio) redirect("/login");

  // Fetch photos using portfolio ID
  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("portfolio_id", portfolio.id)
    .order("sort_order", { ascending: true });

  const tier = (profile.tier as Tier) ?? "free";
  const maxPhotos = TIER_LIMITS[tier].maxPhotos;
  const photoCount = photos?.length ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <p className="section-label mb-6">Portfolio</p>
      <h1 className="font-heading text-3xl md:text-4xl font-light italic text-foreground mb-3">
        Your portfolio.
      </h1>
      <p className="text-[10px] uppercase tracking-wide text-muted/60 mb-12">
        {photoCount} of {maxPhotos} photos · {tier} tier
      </p>

      {/* Details: title, subtitle, publish */}
      <section className="mb-16">
        <div className="flex items-center gap-5 mb-8">
          <span className="section-label whitespace-nowrap">Details</span>
          <div className="flex-1 h-px bg-rule" />
        </div>
        <PortfolioSettings portfolio={portfolio as Portfolio} />
      </section>

      {/* Banner */}
      <section className="mb-16">
        <div className="flex items-center gap-5 mb-8">
          <span className="section-label whitespace-nowrap">Banner</span>
          <div className="flex-1 h-px bg-rule" />
        </div>
        <BannerUpload
          portfolioId={portfolio.id}
          userId={user.id}
          currentBannerUrl={portfolio.banner_url}
          currentBannerCrop={(portfolio as Portfolio).banner_crop ?? null}
        />
      </section>

      {/* Photos */}
      <section>
        <div className="flex items-center gap-5 mb-8">
          <span className="section-label whitespace-nowrap">Photos</span>
          <div className="flex-1 h-px bg-rule" />
        </div>
        <PhotoGrid
          initialPhotos={(photos as Photo[]) ?? []}
          portfolioId={portfolio.id}
          userId={user.id}
          tier={tier}
        />
      </section>
    </div>
  );
}
