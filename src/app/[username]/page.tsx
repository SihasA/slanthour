import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Profile, Theme, Portfolio, Photo } from "@/types";
import { PortfolioBanner } from "@/components/portfolio/PortfolioBanner";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { PortfolioAbout } from "@/components/portfolio/PortfolioAbout";
import { FONT_PAIRS } from "@/lib/constants";

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
    profile.bio ?? `${profile.display_name}'s photography portfolio on Slant Hour.`;

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

  const typedProfile = profile as Profile;

  // Fetch theme, portfolio, and photos in parallel
  const [{ data: theme }, { data: portfolio }] = await Promise.all([
    supabase
      .from("themes")
      .select("*")
      .eq("user_id", typedProfile.id)
      .single(),
    supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", typedProfile.id)
      .single(),
  ]);

  if (!portfolio) notFound();

  const typedPortfolio = portfolio as Portfolio;
  const typedTheme = theme as Theme | null;

  // Only show published portfolios (unless there's no portfolio at all)
  if (!typedPortfolio.is_published) notFound();

  // Fetch photos
  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("portfolio_id", typedPortfolio.id)
    .order("sort_order", { ascending: true });

  const typedPhotos = (photos as Photo[]) ?? [];

  // Theme values with defaults
  const bg = typedTheme?.color_background ?? "#0f0e0d";
  const text = typedTheme?.color_text ?? "#f7f5f2";
  const accent = typedTheme?.color_accent ?? "#9c8e7a";
  const fontHeading = typedTheme?.font_heading ?? "Cormorant Garamond";
  const fontBody = typedTheme?.font_body ?? "DM Mono";

  // Build Google Fonts URL for this portfolio's custom fonts
  const fontUrl = buildGoogleFontsUrl(fontHeading, fontBody);

  // Build photo URLs
  const photoUrls = typedPhotos.map((p) => ({
    src: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolios/${p.storage_path}`,
    caption: p.caption,
  }));

  // Find the matching font pair for proper CSS families
  const fontPair = FONT_PAIRS.find(
    (fp) => fp.heading === fontHeading
  );
  const headingFamily = fontPair
    ? `'${fontPair.heading}', serif`
    : `'${fontHeading}', serif`;
  const bodyFamily = fontPair
    ? `'${fontPair.body}', monospace`
    : `'${fontBody}', sans-serif`;

  return (
    <>
      {/* Load custom fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={fontUrl} />

      <div
        style={{
          backgroundColor: bg,
          color: text,
          fontFamily: bodyFamily,
          ["--accent-color" as string]: accent,
        }}
        className="min-h-screen"
      >
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 transition-all duration-300 bg-transparent hover:backdrop-blur-md"
          style={{
            borderBottom: "1px solid transparent",
          }}
        >
          <span
            className="text-lg font-light italic tracking-tight"
            style={{ fontFamily: headingFamily }}
          >
            {typedProfile.display_name}
          </span>
          <nav className="flex items-center gap-6 md:gap-8">
            <a
              href="#work"
              className="text-[10px] uppercase tracking-[0.2em] opacity-50 hover:opacity-100 transition-opacity"
              style={{ fontFamily: bodyFamily }}
            >
              Work
            </a>
            {(typedProfile.bio ||
              typedProfile.email_public ||
              typedProfile.instagram_handle) && (
              <a
                href="#about"
                className="text-[10px] uppercase tracking-[0.2em] opacity-50 hover:opacity-100 transition-opacity"
                style={{ fontFamily: bodyFamily }}
              >
                About
              </a>
            )}
          </nav>
        </header>

        {/* Banner (if set) */}
        {typedPortfolio.banner_url && (
          <PortfolioBanner
            bannerUrl={typedPortfolio.banner_url}
            title={typedPortfolio.title}
            subtitle={typedPortfolio.subtitle}
          />
        )}

        {/* Title (if no banner) */}
        {!typedPortfolio.banner_url && (
          <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12">
            <h1
              className="font-light italic leading-[0.95] tracking-tight mb-3"
              style={{
                fontFamily: headingFamily,
                fontSize: "clamp(48px, 8vw, 88px)",
              }}
            >
              {typedPortfolio.title}
            </h1>
            {typedPortfolio.subtitle && (
              <p
                className="text-[17px] italic opacity-60 leading-relaxed max-w-[500px]"
                style={{ fontFamily: headingFamily }}
              >
                {typedPortfolio.subtitle}
              </p>
            )}
          </section>
        )}

        {/* Photo grid */}
        {photoUrls.length > 0 && (
          <section id="work">
            <PortfolioGrid photos={photoUrls} accentColor={accent} />
          </section>
        )}

        {/* Empty state */}
        {photoUrls.length === 0 && (
          <section className="py-32 text-center">
            <p
              className="text-[17px] italic opacity-40"
              style={{ fontFamily: headingFamily }}
            >
              No photos yet.
            </p>
          </section>
        )}

        {/* About */}
        <div id="about">
          <PortfolioAbout
            displayName={typedProfile.display_name}
            bio={typedProfile.bio}
            emailPublic={typedProfile.email_public}
            instagramHandle={typedProfile.instagram_handle}
            websiteUrl={typedProfile.website_url}
            accentColor={accent}
          />
        </div>

        {/* Footer */}
        <footer
          className="px-6 md:px-12 py-7 flex flex-col md:flex-row justify-between items-center gap-3"
          style={{ borderTop: `1px solid ${accent}20` }}
        >
          <span
            className="text-sm italic opacity-60"
            style={{ fontFamily: headingFamily }}
          >
            {typedProfile.display_name}
          </span>
          <span className="text-[9px] tracking-[0.2em] opacity-30">
            Portfolio by{" "}
            <a
              href="https://slanthour.com"
              className="hover:opacity-80 transition-opacity"
              style={{ color: accent }}
            >
              Slant Hour
            </a>
          </span>
        </footer>
      </div>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function buildGoogleFontsUrl(heading: string, body: string): string {
  const families: string[] = [];

  const encode = (name: string, weights: string) =>
    `family=${name.replace(/ /g, "+")}:ital,wght@${weights}`;

  // Heading font — always include italic
  families.push(encode(heading, "0,300;0,400;1,300;1,400"));

  // Body font (if different from heading)
  if (body !== heading) {
    families.push(encode(body, "0,300;0,400;1,300;1,400"));
  }

  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
