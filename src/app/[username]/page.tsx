import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Profile, Portfolio, Photo } from "@/types";
import { PortfolioBanner } from "@/components/portfolio/PortfolioBanner";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { PortfolioAbout } from "@/components/portfolio/PortfolioAbout";
import { PortfolioHeader } from "@/components/portfolio/PortfolioHeader";

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

  // Fetch portfolio
  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("*")
    .eq("user_id", p.id)
    .single();

  if (!portfolio) notFound();

  const port = portfolio as Portfolio;

  if (!port.is_published) notFound();

  // Fetch photos
  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("portfolio_id", port.id)
    .order("sort_order", { ascending: true });

  const photoList = (photos as Photo[]) ?? [];

  // Photo URLs
  const photoUrls = photoList.map((ph) => ({
    src: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolios/${ph.storage_path}`,
    caption: ph.caption,
  }));

  const hasBanner = !!port.banner_url;
  const hasAbout = !!(p.bio || p.email_public || p.instagram_handle || p.website_url);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400&display=swap"
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            html { scroll-behavior: smooth; }
            body {
              background: #0f0e0d;
              color: #e8e4df;
              font-family: 'DM Mono', monospace;
              font-weight: 300;
              -webkit-font-smoothing: antialiased;
            }
            @media (max-width: 768px) {
              .portfolio-header { padding: 20px 24px !important; }
              .portfolio-header nav { gap: 20px !important; }
              .portfolio-banner { height: 50vh !important; min-height: 300px !important; }
              .portfolio-banner-text { bottom: 32px !important; left: 24px !important; right: 24px !important; }
              .portfolio-footer {
                padding: 24px !important;
                flex-direction: column !important;
                gap: 12px !important;
                text-align: center !important;
              }
            }
          `,
        }}
      />

      <div
        style={{
          background: "#0f0e0d",
          color: "#e8e4df",
          fontFamily: "'DM Mono', monospace",
          fontWeight: 300,
        }}
        className="min-h-screen"
      >
        <PortfolioHeader
          displayName={p.display_name}
          hasAbout={hasAbout}
          hasBanner={hasBanner}
        />

        {/* Banner */}
        {hasBanner && (
          <PortfolioBanner
            bannerUrl={port.banner_url!}
            title={port.title}
            subtitle={port.subtitle}
          />
        )}

        {/* Title (no banner) */}
        {!hasBanner && (
          <section
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "140px 48px 32px",
            }}
          >
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(48px, 8vw, 88px)",
                fontWeight: 300,
                lineHeight: 0.92,
                letterSpacing: "-0.02em",
                color: "#e8e4df",
                marginBottom: 16,
              }}
            >
              {port.title}
            </h1>
            {port.subtitle && (
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 18,
                  fontStyle: "italic",
                  color: "rgba(255,255,255,0.6)",
                  maxWidth: 420,
                  lineHeight: 1.7,
                }}
              >
                {port.subtitle}
              </p>
            )}
          </section>
        )}

        {/* Photos */}
        {photoUrls.length > 0 && (
          <div id="work">
            <PortfolioGrid photos={photoUrls} />
          </div>
        )}

        {photoUrls.length === 0 && (
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "40px 24px 120px",
            }}
          >
            <div
              style={{
                padding: 80,
                textAlign: "center",
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                color: "#6b6760",
              }}
            >
              No photos yet.
            </div>
          </div>
        )}

        {/* About */}
        {hasAbout && (
          <div id="about">
            <PortfolioAbout
              displayName={p.display_name}
              bio={p.bio}
              emailPublic={p.email_public}
              instagramHandle={p.instagram_handle}
              websiteUrl={p.website_url}
            />
          </div>
        )}

        {/* Footer */}
        <footer
          className="portfolio-footer"
          style={{
            borderTop: "1px solid #222120",
            padding: "28px 48px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: 16,
              color: "#6b6760",
            }}
          >
            {p.display_name.split(" ")[0]}
          </span>
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.15em",
              color: "#6b6760",
              opacity: 0.5,
            }}
          >
            &copy; {new Date().getFullYear()} &middot; Portfolio by{" "}
            <a
              href="https://slanthour.com"
              style={{ color: "#9c8e7a", textDecoration: "none" }}
            >
              Slant Hour
            </a>
          </span>
        </footer>
      </div>
    </>
  );
}
