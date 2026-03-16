import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Profile, Portfolio, Photo, Theme } from "@/types";
import { buildThemeVars, getLockedTheme } from "@/lib/theme";
import { EditorialLayout } from "@/components/portfolio/themes/EditorialLayout";
import { JournalLayout } from "@/components/portfolio/themes/JournalLayout";
import { CinematicLayout } from "@/components/portfolio/themes/CinematicLayout";

// ─── Dynamic metadata ────────────────────────────────────────

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio")
    .eq("username", username)
    .single();

  if (!profile) {
    return { title: "Not Found — Slant Hour" };
  }

  const title = `${profile.display_name} — Slant Hour`;
  const description =
    profile.bio ??
    `${profile.display_name}'s photography portfolio on Slant Hour.`;

  return {
    title,
    description,
    openGraph: {
      title: profile.display_name,
      description,
      url: `https://slanthour.com/${username}`,
      siteName: "Slant Hour",
      type: "profile",
    },
  };
}

// ─── Page ────────────────────────────────────────────────────

export default async function PortfolioPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();
  const p = profile as Profile;

  // Fetch portfolio + theme in parallel
  const [{ data: portfolio }, { data: theme }] = await Promise.all([
    supabase.from("portfolios").select("*").eq("user_id", p.id).single(),
    supabase.from("themes").select("*").eq("user_id", p.id).single(),
  ]);

  if (!portfolio) notFound();
  const port = portfolio as Portfolio;
  if (!port.is_published) notFound();

  // Default theme if somehow missing
  const t: Theme = theme
    ? (theme as Theme)
    : {
        id: "",
        user_id: p.id,
        mode: "dark",
        font_heading: "Cormorant Garamond",
        font_body: "DM Mono",
        color_background: "#0a0908",
        color_text: "#f0ece4",
        color_accent: "#9c8e7a",
        layout_theme: "editorial",
      };

  // Fetch photos
  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("portfolio_id", port.id)
    .order("sort_order", { ascending: true });

  const photoList = (photos as Photo[]) ?? [];

  const photoUrls = photoList.map((ph) => ({
    src: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolios/${ph.storage_path}`,
    caption: ph.caption,
  }));

  const hasBanner = !!port.banner_url;
  const hasAbout = !!(
    p.bio ||
    p.email_public ||
    p.instagram_handle ||
    p.website_url
  );

  const locked = getLockedTheme(t.layout_theme, t.color_accent);
  const themeVars = buildThemeVars(t);
  const layoutProps = {
    profile: p,
    portfolio: port,
    photos: photoUrls,
    theme: t,
    hasBanner,
    hasAbout,
  };

  return (
    <>
      {/* Override body bg for this portfolio — derived from layout_theme */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html { scroll-behavior: smooth; }
            body {
              background: ${locked.bg} !important;
              color: ${locked.text} !important;
              -webkit-font-smoothing: antialiased;
            }
          `,
        }}
      />

      <div style={themeVars as React.CSSProperties}>
        {t.layout_theme === "journal" && <JournalLayout {...layoutProps} />}
        {t.layout_theme === "cinematic" && <CinematicLayout {...layoutProps} />}
        {(t.layout_theme === "editorial" ||
          !["journal", "cinematic"].includes(t.layout_theme)) && (
          <EditorialLayout {...layoutProps} />
        )}
      </div>
    </>
  );
}
