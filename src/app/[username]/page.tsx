import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Profile, Theme, Portfolio, Photo } from "@/types";
import { PortfolioBanner } from "@/components/portfolio/PortfolioBanner";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { PortfolioAbout } from "@/components/portfolio/PortfolioAbout";
import { PortfolioHeader } from "@/components/portfolio/PortfolioHeader";
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

  // Fetch theme + portfolio in parallel
  const [{ data: theme }, { data: portfolio }] = await Promise.all([
    supabase.from("themes").select("*").eq("user_id", p.id).single(),
    supabase.from("portfolios").select("*").eq("user_id", p.id).single(),
  ]);

  if (!portfolio) notFound();

  const port = portfolio as Portfolio;
  const t = theme as Theme | null;

  if (!port.is_published) notFound();

  // Fetch photos
  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("portfolio_id", port.id)
    .order("sort_order", { ascending: true });

  const photoList = (photos as Photo[]) ?? [];

  // ─── Theme colours ─────────────────────────────────────────
  const mode = t?.mode ?? "dark";
  const bg = t?.color_background ?? "#0f0e0d";
  const text = t?.color_text ?? "#f7f5f2";
  const accent = t?.color_accent ?? "#9c8e7a";
  const fontHeading = t?.font_heading ?? "Cormorant Garamond";
  const fontBody = t?.font_body ?? "DM Mono";

  // Derive secondary colours from the mode
  const isDark = mode === "dark";
  const muted = isDark ? "#6b6760" : "#8a8580";
  const rule = isDark ? "#222120" : "#d8d4cf";
  const surface = isDark ? "#161514" : "#edeae6";
  const headerBg = isDark
    ? "rgba(15,14,13,0.88)"
    : "rgba(247,245,242,0.92)";

  // Font families
  const fontPair = FONT_PAIRS.find((fp) => fp.heading === fontHeading);
  const headingFamily = `'${fontHeading}', ${fontPair ? "serif" : "sans-serif"}`;
  const bodyFamily = `'${fontBody}', ${fontPair?.body.includes("Mono") || fontBody.includes("Mono") ? "monospace" : "sans-serif"}`;

  const fontUrl = buildGoogleFontsUrl(fontHeading, fontBody);

  // Photo URLs
  const photoUrls = photoList.map((ph) => ({
    src: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolios/${ph.storage_path}`,
    caption: ph.caption,
  }));

  const hasBanner = !!port.banner_url;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={fontUrl} />

      <div
        style={{
          backgroundColor: bg,
          color: text,
          fontFamily: bodyFamily,
          ["--rule-color" as string]: rule,
          ["--surface-color" as string]: surface,
          ["--accent-color" as string]: accent,
        }}
        className="min-h-screen"
      >
        <PortfolioHeader
          displayName={p.display_name}
          hasBio={!!(p.bio || p.email_public || p.instagram_handle)}
          hasBanner={hasBanner}
          headingFamily={headingFamily}
          bodyFamily={bodyFamily}
          textColor={text}
          mutedColor={muted}
          bgColor={bg}
          headerBg={headerBg}
          ruleColor={rule}
        />

        {/* Banner */}
        {hasBanner && (
          <PortfolioBanner
            bannerUrl={port.banner_url!}
            title={port.title}
            subtitle={port.subtitle}
            headingFamily={headingFamily}
          />
        )}

        {/* Title (no banner) */}
        {!hasBanner && (
          <section className="pt-32 pb-8 md:pt-40 md:pb-12 px-6 md:px-12 max-w-[1200px] mx-auto">
            <h1
              className="font-light italic leading-[0.92] mb-4"
              style={{
                fontFamily: headingFamily,
                fontSize: "clamp(48px, 8vw, 88px)",
                letterSpacing: "-0.02em",
              }}
            >
              {port.title}
            </h1>
            {port.subtitle && (
              <p
                className="text-[18px] italic leading-[1.7] max-w-[420px]"
                style={{ fontFamily: headingFamily, color: muted }}
              >
                {port.subtitle}
              </p>
            )}
          </section>
        )}

        {/* Photos */}
        {photoUrls.length > 0 && (
          <section id="work">
            <PortfolioGrid photos={photoUrls} accentColor={accent} />
          </section>
        )}

        {photoUrls.length === 0 && (
          <section className="py-32 text-center">
            <p
              className="text-[17px] italic"
              style={{ fontFamily: headingFamily, color: muted }}
            >
              No photos yet.
            </p>
          </section>
        )}

        {/* About */}
        <div id="about">
          <PortfolioAbout
            displayName={p.display_name}
            bio={p.bio}
            emailPublic={p.email_public}
            instagramHandle={p.instagram_handle}
            websiteUrl={p.website_url}
            accentColor={accent}
            headingFamily={headingFamily}
            bodyFamily={bodyFamily}
            ruleColor={rule}
            mutedColor={muted}
          />
        </div>

        {/* Footer */}
        <footer
          className="px-6 md:px-12 py-7 flex flex-col md:flex-row justify-between items-center gap-3"
          style={{ borderTop: `1px solid ${rule}` }}
        >
          <span
            className="italic text-base"
            style={{ fontFamily: headingFamily, color: muted }}
          >
            {p.display_name}
          </span>
          <span
            className="text-[9px] opacity-50"
            style={{ letterSpacing: "0.15em", color: muted }}
          >
            &copy; {new Date().getFullYear()} &middot; Portfolio by{" "}
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

  families.push(encode(heading, "0,300;0,400;1,300;1,400"));
  if (body !== heading) {
    families.push(encode(body, "0,300;0,400;1,300;1,400"));
  }

  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
