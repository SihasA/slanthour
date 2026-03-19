"use client";

import { useState } from "react";
import type { Profile, Portfolio, Theme } from "@/types";
import { ThemeHeader } from "../ThemeHeader";
import { CopyProtection } from "../CopyProtection";
import { Lightbox } from "../Lightbox";
import { getLockedTheme, getFontCss } from "@/lib/theme";

interface JournalLayoutProps {
  profile: Profile;
  portfolio: Portfolio;
  photos: { src: string; caption: string | null }[];
  theme: Theme;
  hasBanner: boolean;
  hasAbout: boolean;
}

export function JournalLayout({
  profile,
  portfolio,
  photos,
  theme,
  hasBanner,
  hasAbout,
}: JournalLayoutProps) {
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
          variant="journal"
          bgColor={bg}
          textColor={text}
          mutedColor={muted}
          accentColor={accent}
          headerBg={locked.headerBg}
          ruleColor={border}
          headingFont={heading}
          bodyFont={body}
        />

        {/* Banner — contained, NOT full-bleed */}
        <section
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "8rem 3rem 0",
          }}
        >
          {hasBanner && (
            <div
              style={{
                width: "100%",
                aspectRatio: "2.5/1",
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
                    : "center 50%",
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
            </div>
          )}

          {/* Title — BELOW banner, separated by border */}
          <div
            style={{
              padding: "2.5rem 0",
              borderBottom: `1px solid ${border}`,
            }}
          >
            <h1
              style={{
                fontFamily: heading,
                fontSize: "clamp(2rem, 5vw, 2.8rem)",
                fontWeight: 400,
                lineHeight: 1.2,
                color: text,
              }}
            >
              {portfolio.title_line2 ? (
                <>
                  {portfolio.title}
                  <br />
                  <span
                    style={{
                      color: portfolio.title_line2_accent ? accent : "inherit",
                      fontStyle: portfolio.title_line2_accent ? "italic" : "inherit",
                    }}
                  >
                    {portfolio.title_line2}
                  </span>
                </>
              ) : (
                <JournalTitle title={portfolio.title} accent={accent} />
              )}
            </h1>
            {portfolio.subtitle && (
              <p
                style={{
                  fontFamily: body,
                  fontSize: "0.85rem",
                  fontWeight: 300,
                  color: muted,
                  marginTop: "0.75rem",
                  lineHeight: 1.7,
                  maxWidth: 400,
                }}
              >
                {portfolio.subtitle}
              </p>
            )}
          </div>
        </section>

        {/* Photo count */}
        {photos.length > 0 && (
          <div
            style={{
              maxWidth: 900,
              margin: "0 auto",
              padding: "2rem 3rem 1rem",
              fontSize: "0.65rem",
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: muted,
            }}
          >
            {photos.length} photograph{photos.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* Photo grid — staggered 2-column portrait */}
        {photos.length > 0 && (
          <div
            id="work"
            className="journal-grid-wrap"
            style={{ maxWidth: 900, margin: "0 auto", padding: "0 3rem 4rem" }}
          >
            <div
              className="journal-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "2.5rem 2rem",
              }}
            >
              {photos.map((photo, i) => (
                <JournalGridItem
                  key={i}
                  photo={photo}
                  index={i}
                  surface={surface}
                  muted={muted}
                  body={body}
                  onClick={() => setLightboxIndex(i)}
                />
              ))}
            </div>
          </div>
        )}

        {photos.length === 0 && (
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 3rem 100px" }}>
            <div style={{ padding: 80, textAlign: "center", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: muted }}>
              No photographs yet.
            </div>
          </div>
        )}

        {/* About */}
        {hasAbout && (
          <JournalAbout
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
          style={{
            maxWidth: 900,
            margin: "0 auto",
            borderTop: `1px solid ${border}`,
            textAlign: "center",
            padding: "2rem 3rem 3rem",
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
          .journal-grid { grid-template-columns: 1fr !important; }
          .journal-grid > div { padding-top: 0 !important; }
          .journal-grid-wrap { padding: 0 1.5rem 3rem !important; }
        }
      `}} />
    </CopyProtection>
  );
}

// ─── Journal title: last word in accent italic ───────────────

function JournalTitle({ title, accent }: { title: string; accent: string }) {
  const words = title.trim().split(" ");
  if (words.length <= 1) {
    return <span style={{ color: accent, fontStyle: "italic" }}>{title}</span>;
  }
  const leading = words.slice(0, -1).join(" ");
  const last = words[words.length - 1];
  return (
    <>
      {leading}{" "}
      <span style={{ color: accent, fontStyle: "italic" }}>{last}</span>
    </>
  );
}

// ─── Grid item with visible caption ─────────────────────────

function JournalGridItem({
  photo,
  index,
  surface,
  muted,
  body,
  onClick,
}: {
  photo: { src: string; caption: string | null };
  index: number;
  surface: string;
  muted: string;
  body: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isEven = index % 2 === 1; // odd indices get stagger

  return (
    <div style={{ paddingTop: isEven ? "3rem" : 0 }}>
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          aspectRatio: "4/5",
          overflow: "hidden",
          cursor: "pointer",
          background: surface,
          position: "relative",
          transition: "transform 0.3s ease-out",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt={photo.caption || `Photograph ${index + 1}`}
          loading={index < 4 ? "eager" : "lazy"}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: "opacity 0.3s",
            opacity: hovered ? 0.92 : 1,
            pointerEvents: "none",
            userSelect: "none",
          } as React.CSSProperties}
        />
      </div>
      {/* Caption — visible by default in Journal */}
      {photo.caption && (
        <p
          style={{
            fontFamily: body,
            fontSize: "0.7rem",
            fontWeight: 300,
            fontStyle: "italic",
            color: muted,
            marginTop: "0.75rem",
            lineHeight: 1.5,
          }}
        >
          {photo.caption}
        </p>
      )}
    </div>
  );
}

// ─── About section — left-aligned, book-like ─────────────────

function JournalAbout({
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
      style={{
        maxWidth: 550,
        margin: "0 auto",
        padding: "3rem 3rem 5rem",
        textAlign: "left",
      }}
    >
      <div style={{ width: 40, height: 1, background: accent, marginBottom: "2rem" }} />
      <h2 style={{ fontFamily: heading, fontSize: "1.4rem", fontWeight: 400, marginBottom: "1.25rem", color: text }}>
        About
      </h2>
      {profile.bio && (
        <p style={{ fontSize: "0.85rem", lineHeight: 1.8, color: muted, marginBottom: "0.75rem" }}>
          {profile.bio}
        </p>
      )}
      <div style={{ display: "flex", gap: "1.5rem", marginTop: "2rem" }}>
        {profile.email_public && (
          <a href={`mailto:${profile.email_public}`} style={{ fontSize: "0.7rem", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: accent, textDecoration: "none" }}>
            Email
          </a>
        )}
        {profile.instagram_handle && (
          <a href={`https://instagram.com/${profile.instagram_handle}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: accent, textDecoration: "none" }}>
            Instagram
          </a>
        )}
        {profile.website_url && (
          <a href={profile.website_url.startsWith("http") ? profile.website_url : `https://${profile.website_url}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.7rem", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: accent, textDecoration: "none" }}>
            Website
          </a>
        )}
      </div>
    </section>
  );
}
