"use client";

import { useState } from "react";
import type { Profile, Portfolio, Theme } from "@/types";

// Convert #rrggbb to "r,g,b" for use in rgba()
function hexToRgbStr(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "10,9,8";
  return `${r},${g},${b}`;
}
import { ThemeHeader } from "../ThemeHeader";
import { CopyProtection } from "../CopyProtection";
import { Lightbox } from "../Lightbox";
import { getLockedTheme, getFontCss } from "@/lib/theme";

interface EditorialLayoutProps {
  profile: Profile;
  portfolio: Portfolio;
  photos: { src: string; caption: string | null }[];
  theme: Theme;
  hasBanner: boolean;
  hasAbout: boolean;
}

export function EditorialLayout({
  profile,
  portfolio,
  photos,
  theme,
  hasBanner,
  hasAbout,
}: EditorialLayoutProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const locked = getLockedTheme(theme.layout_theme, theme.color_accent);
  const bg = locked.bg;
  const text = locked.text;
  const accent = locked.accent;
  const muted = locked.muted;
  const surface = locked.surface;
  const border = locked.border;
  const heading = getFontCss(locked.fontHeading);
  const body = getFontCss(locked.fontBody);

  return (
    <CopyProtection>
      <div
        style={{
          background: bg,
          color: text,
          fontFamily: body,
          fontWeight: 300,
          minHeight: "100vh",
        }}
      >
        <ThemeHeader
          displayName={profile.display_name}
          hasAbout={hasAbout}
          hasBanner={hasBanner}
          variant="editorial"
          bgColor={bg}
          textColor={text}
          mutedColor={muted}
          accentColor={accent}
          headerBg={locked.headerBg}
          ruleColor={border}
          headingFont={heading}
          bodyFont={body}
        />

        {/* Banner — full-bleed with strong gradient overlay */}
        {hasBanner && (
          <section
            data-banner
            className="portfolio-banner"
            style={{
              position: "relative",
              width: "100%",
              height: "75vh",
              minHeight: 500,
              overflow: "hidden",
              background: surface,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portfolio.banner_url!}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: portfolio.banner_crop
                  ? `${portfolio.banner_crop.x}% ${portfolio.banner_crop.y}%`
                  : "center 40%",
                display: "block",
                ...(portfolio.banner_crop && portfolio.banner_crop.zoom > 1
                  ? {
                      transform: `scale(${portfolio.banner_crop.zoom})`,
                      transformOrigin: `${portfolio.banner_crop.x}% ${portfolio.banner_crop.y}%`,
                    }
                  : {}),
              }}
              draggable={false}
            />
            {/* Strong gradient: solid at bottom, fading up */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to top, ${bg} 0%, rgba(${hexToRgbStr(bg)},0.85) 15%, rgba(${hexToRgbStr(bg)},0.3) 40%, rgba(${hexToRgbStr(bg)},0.1) 60%, transparent 100%)`,
              }}
            />
            <div
              className="portfolio-banner-text"
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 2.5rem 3rem" }}
            >
              <h1
                style={{
                  fontFamily: heading,
                  fontSize: "clamp(2.8rem, 7vw, 4.5rem)",
                  fontWeight: 600,
                  fontStyle: "italic",
                  lineHeight: 1.1,
                  color: text,
                }}
              >
                <EditorialTitleLines portfolio={portfolio} accent={accent} />
              </h1>
              {portfolio.subtitle && (
                <p
                  style={{
                    fontFamily: heading,
                    fontSize: "1.1rem",
                    fontStyle: "italic",
                    color: muted,
                    fontWeight: 400,
                    maxWidth: 500,
                    lineHeight: 1.6,
                    marginTop: "1rem",
                  }}
                >
                  {portfolio.subtitle}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Title (no banner) — solid dark bg */}
        {!hasBanner && (
          <section
            style={{
              background: bg,
              padding: "160px 40px 48px",
            }}
          >
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <h1
                style={{
                  fontFamily: heading,
                  fontSize: "clamp(2.8rem, 7vw, 4.5rem)",
                  fontWeight: 600,
                  fontStyle: "italic",
                  lineHeight: 1.1,
                  color: text,
                }}
              >
                <EditorialTitleLines portfolio={portfolio} accent={accent} />
              </h1>
              {portfolio.subtitle && (
                <p
                  style={{
                    fontFamily: heading,
                    fontSize: "1.1rem",
                    fontStyle: "italic",
                    color: muted,
                    fontWeight: 400,
                    maxWidth: 500,
                    lineHeight: 1.6,
                    marginTop: "1rem",
                  }}
                >
                  {portfolio.subtitle}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Photo grid — 3-col square */}
        {photos.length > 0 && (
          <div id="work" className="grid-wrap" style={{ maxWidth: 1200, margin: "2.5rem auto 0", padding: "0 40px 120px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 3,
              }}
            >
              {photos.map((photo, i) => (
                <EditorialGridItem
                  key={i}
                  photo={photo}
                  index={i}
                  surface={surface}
                  bg={bg}
                  onClick={() => setLightboxIndex(i)}
                />
              ))}
            </div>
          </div>
        )}

        {photos.length === 0 && (
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 120px" }}>
            <div style={{ padding: 80, textAlign: "center", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: muted }}>
              No photographs yet.
            </div>
          </div>
        )}

        {/* About */}
        {hasAbout && (
          <EditorialAbout
            profile={profile}
            heading={heading}
            body={body}
            text={text}
            muted={muted}
            accent={accent}
            border={border}
          />
        )}

        {/* Footer */}
        <footer
          className="portfolio-footer"
          style={{
            textAlign: "center",
            padding: "2rem 40px 3rem",
            fontSize: "0.65rem",
            color: muted,
          }}
        >
          Hosted on{" "}
          <a href="https://slanthour.com" style={{ color: accent, textDecoration: "none" }}>slanthour.com</a>
        </footer>
      </div>

      {lightboxIndex !== null && (
        <Lightbox photos={photos} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .portfolio-header { padding: 1rem 1.25rem !important; }
          .portfolio-header nav { gap: 20px !important; }
          .portfolio-banner { height: 50vh !important; min-height: 300px !important; }
          .portfolio-banner-text { padding: 0 1.25rem 2rem !important; }
          .grid-wrap { padding: 0 1rem 80px !important; }
          .grid-wrap > div { grid-template-columns: repeat(2, 1fr) !important; }
          .editorial-about { padding: 3rem 1.25rem !important; }
          .portfolio-footer { padding: 24px 20px !important; }
        }
      `}} />
    </CopyProtection>
  );
}

// ─── Two-line title helper ───────────────────────────────────

function EditorialTitleLines({ portfolio, accent }: { portfolio: Portfolio; accent: string }) {
  const { title, title_line2, title_line2_accent } = portfolio;
  if (!title_line2) return <>{title}</>;
  return (
    <>
      {title}
      <br />
      <span
        style={{
          color: title_line2_accent ? accent : "inherit",
          fontStyle: title_line2_accent ? "italic" : "inherit",
        }}
      >
        {title_line2}
      </span>
    </>
  );
}

// ─── Grid item ───────────────────────────────────────────────

function EditorialGridItem({
  photo,
  index,
  surface,
  bg,
  onClick,
}: {
  photo: { src: string; caption: string | null };
  index: number;
  surface: string;
  bg: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        aspectRatio: "1/1",
        overflow: "hidden",
        cursor: "pointer",
        background: surface,
        position: "relative",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        alt={photo.caption || `Photograph ${index + 1}`}
        loading={index < 3 ? "eager" : "lazy"}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transition: "transform 0.3s ease-out",
          transform: hovered ? "scale(1.03)" : "scale(1)",
          pointerEvents: "none",
          userSelect: "none",
        } as React.CSSProperties}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: hovered ? `rgba(${hexToRgbStr(bg)},0.15)` : "transparent",
          transition: "background 0.3s",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ─── About section ───────────────────────────────────────────

function EditorialAbout({
  profile,
  heading,
  body,
  text,
  muted,
  accent,
  border,
}: {
  profile: Profile;
  heading: string;
  body: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
}) {
  return (
    <section
      id="about"
      className="editorial-about"
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "5rem 2.5rem",
        textAlign: "center",
      }}
    >
      <div style={{ width: "100%", height: 1, background: border, marginBottom: "3rem" }} />
      <h2 style={{ fontFamily: heading, fontSize: "1.8rem", fontWeight: 400, marginBottom: "1.5rem", color: text }}>
        About
      </h2>
      {profile.bio && (
        <p style={{ fontSize: "0.8rem", lineHeight: 1.8, color: muted, marginBottom: "1rem" }}>
          {profile.bio}
        </p>
      )}
      <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "2rem" }}>
        {profile.email_public && (
          <a href={`mailto:${profile.email_public}`} style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: accent, textDecoration: "none", borderBottom: "1px solid transparent", paddingBottom: 2 }}>
            Email
          </a>
        )}
        {profile.instagram_handle && (
          <a href={`https://instagram.com/${profile.instagram_handle}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: accent, textDecoration: "none", borderBottom: "1px solid transparent", paddingBottom: 2 }}>
            Instagram
          </a>
        )}
        {profile.website_url && (
          <a href={profile.website_url.startsWith("http") ? profile.website_url : `https://${profile.website_url}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: accent, textDecoration: "none", borderBottom: "1px solid transparent", paddingBottom: 2 }}>
            Website
          </a>
        )}
      </div>
    </section>
  );
}
