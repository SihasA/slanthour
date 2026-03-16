"use client";

import { useState } from "react";
import type { Profile, Portfolio, Theme } from "@/types";
import { ThemeHeader } from "../ThemeHeader";
import { CopyProtection } from "../CopyProtection";
import { Lightbox } from "../Lightbox";
import { getLockedTheme, getFontCss } from "@/lib/theme";

interface CinematicLayoutProps {
  profile: Profile;
  portfolio: Portfolio;
  photos: { src: string; caption: string | null }[];
  theme: Theme;
  hasBanner: boolean;
  hasAbout: boolean;
}

export function CinematicLayout({
  profile,
  portfolio,
  photos,
  theme,
  hasBanner,
  hasAbout,
}: CinematicLayoutProps) {
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

  const slots = buildCinematicSlots(photos);

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
          variant="cinematic"
          bgColor={bg}
          textColor={text}
          mutedColor={muted}
          accentColor={accent}
          headerBg={locked.headerBg}
          ruleColor={border}
          headingFont={heading}
          bodyFont={body}
        />

        {/* Hero — 100vh */}
        <section
          data-banner
          style={{
            position: "relative",
            width: "100%",
            height: "100vh",
            overflow: "hidden",
            display: "flex",
            alignItems: "flex-end",
            background: surface,
          }}
        >
          {hasBanner && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portfolio.banner_url!}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                draggable={false}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(to top, rgba(14,16,16,0.95) 0%, rgba(14,16,16,0.4) 30%, transparent 60%)`,
                }}
              />
            </>
          )}

          {/* Title content */}
          <div
            className="cinematic-hero-content"
            style={{
              position: "relative",
              zIndex: 1,
              padding: "0 3rem 4rem",
              width: "100%",
            }}
          >
            {portfolio.subtitle && (
              <p
                style={{
                  fontFamily: body,
                  fontSize: "0.6rem",
                  fontWeight: 400,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: accent,
                  marginBottom: "1rem",
                }}
              >
                {portfolio.subtitle}
              </p>
            )}
            <h1
              style={{
                fontFamily: heading,
                fontSize: "clamp(2.8rem, 8vw, 5rem)",
                fontWeight: 300,
                lineHeight: 1.05,
                color: text,
                letterSpacing: "-0.02em",
              }}
            >
              <CinematicTitle title={portfolio.title} />
            </h1>
          </div>

          {/* Scroll indicator */}
          <div
            className="cinematic-scroll-indicator"
            style={{
              position: "absolute",
              bottom: "2rem",
              right: "3rem",
              fontFamily: body,
              fontSize: "0.55rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: muted,
              writingMode: "vertical-rl",
            }}
          >
            Scroll
          </div>
        </section>

        {/* Sequence header */}
        {photos.length > 0 && (
          <div
            id="work"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "2rem 3rem",
              maxWidth: 1400,
              margin: "0 auto",
            }}
          >
            <span
              style={{
                fontSize: "0.6rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: muted,
              }}
            >
              {photos.length} photograph{photos.length !== 1 ? "s" : ""}
            </span>
            <div style={{ flex: 1, height: 1, background: border, marginLeft: "2rem" }} />
          </div>
        )}

        {/* Photo sequence */}
        {photos.length > 0 && (
          <div style={{ padding: "0.5rem 0 2rem" }}>
            {slots.map((slot, si) => (
              <div key={si}>
                {slot.type === "full" && (
                  <div className="cinematic-row-full" style={{ padding: "0.5rem 0" }}>
                    <CinematicFullImage
                      photo={photos[slot.indices[0]]}
                      index={slot.indices[0]}
                      surface={surface}
                      body={body}
                      onClick={() => setLightboxIndex(slot.indices[0])}
                    />
                  </div>
                )}
                {slot.type === "pair" && (
                  <>
                    <div style={{ height: "3rem" }} />
                    <div
                      className="cinematic-pair"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 4,
                        maxWidth: 1400,
                        margin: "0 auto",
                        padding: "0 3rem",
                      }}
                    >
                      {slot.indices.map((idx) => (
                        <CinematicSquareImage
                          key={idx}
                          photo={photos[idx]}
                          index={idx}
                          surface={surface}
                          body={body}
                          onClick={() => setLightboxIndex(idx)}
                        />
                      ))}
                    </div>
                    <div style={{ height: "3rem" }} />
                  </>
                )}
                {slot.type === "pair-asym" && (
                  <>
                    <div style={{ height: "3rem" }} />
                    <div
                      className="cinematic-pair-asym"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr",
                        gap: 4,
                        maxWidth: 1400,
                        margin: "0 auto",
                        padding: "0 3rem",
                      }}
                    >
                      {slot.indices.map((idx) => (
                        <CinematicPortraitImage
                          key={idx}
                          photo={photos[idx]}
                          index={idx}
                          surface={surface}
                          body={body}
                          onClick={() => setLightboxIndex(idx)}
                        />
                      ))}
                    </div>
                    <div style={{ height: "3rem" }} />
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {photos.length === 0 && (
          <div style={{ padding: "80px 3rem", textAlign: "center", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: muted }}>
            No photographs yet.
          </div>
        )}

        {/* About */}
        {hasAbout && (
          <CinematicAbout
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
            textAlign: "center",
            padding: "2rem 3rem 3rem",
            fontSize: "0.6rem",
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
        @keyframes cinematic-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .cinematic-scroll-indicator {
          animation: cinematic-pulse 2s ease-in-out infinite;
        }
        @media (max-width: 768px) {
          .cinematic-hero-content { padding: 0 1.5rem 3rem !important; }
          .cinematic-scroll-indicator { display: none !important; }
          .cinematic-pair, .cinematic-pair-asym {
            grid-template-columns: 1fr !important;
            padding: 0 1rem !important;
          }
          .cinematic-row-full { padding: 0.5rem 0 !important; }
          .cinematic-about-grid { grid-template-columns: 1fr !important; gap: 0.5rem 0 !important; }
        }
      `}} />
    </CopyProtection>
  );
}

// ─── Title: first word light, rest bold ──────────────────────

function CinematicTitle({ title }: { title: string }) {
  const words = title.trim().split(" ");
  if (words.length <= 1) {
    return <span style={{ fontWeight: 500 }}>{title}</span>;
  }
  const first = words[0];
  const rest = words.slice(1).join(" ");
  return (
    <>
      <span style={{ fontWeight: 300 }}>{first}</span>{" "}
      <strong style={{ fontWeight: 500 }}>{rest}</strong>
    </>
  );
}

// ─── Layout slot builder ─────────────────────────────────────

interface LayoutSlot {
  type: "full" | "pair" | "pair-asym";
  indices: number[];
}

function buildCinematicSlots(
  photos: { src: string; caption: string | null }[]
): LayoutSlot[] {
  const slots: LayoutSlot[] = [];
  let i = 0;
  let pairToggle = false;

  while (i < photos.length) {
    slots.push({ type: "full", indices: [i] });
    i++;
    if (i >= photos.length) break;

    const pairType = pairToggle ? "pair-asym" : "pair";
    if (i + 1 < photos.length) {
      slots.push({ type: pairType, indices: [i, i + 1] });
      i += 2;
    } else {
      slots.push({ type: "full", indices: [i] });
      i++;
    }
    pairToggle = !pairToggle;
  }

  return slots;
}

// ─── Full-width image (16:9) ─────────────────────────────────

function CinematicFullImage({
  photo,
  index,
  surface,
  body,
  onClick,
}: {
  photo: { src: string; caption: string | null };
  index: number;
  surface: string;
  body: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        aspectRatio: "16/9",
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
          transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: hovered ? "scale(1.02)" : "scale(1)",
          pointerEvents: "none",
          userSelect: "none",
        } as React.CSSProperties}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: hovered ? "rgba(14,16,16,0.1)" : "transparent",
          transition: "background 0.4s",
          pointerEvents: "none",
        }}
      />
      {photo.caption && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "2rem 1.5rem 1.25rem",
            background: "linear-gradient(to top, rgba(14,16,16,0.7), transparent)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.3s",
            pointerEvents: "none",
          }}
        >
          <p style={{ fontFamily: body, fontSize: "0.65rem", color: "rgba(228,226,222,0.8)", letterSpacing: "0.03em" }}>
            {photo.caption}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Square image (for pairs) ────────────────────────────────

function CinematicSquareImage({
  photo,
  index,
  surface,
  body,
  onClick,
}: {
  photo: { src: string; caption: string | null };
  index: number;
  surface: string;
  body: string;
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
        loading="lazy"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: hovered ? "scale(1.02)" : "scale(1)",
          pointerEvents: "none",
          userSelect: "none",
        } as React.CSSProperties}
      />
      {photo.caption && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "2rem 1.5rem 1.25rem",
            background: "linear-gradient(to top, rgba(14,16,16,0.7), transparent)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.3s",
            pointerEvents: "none",
          }}
        >
          <p style={{ fontFamily: body, fontSize: "0.65rem", color: "rgba(228,226,222,0.8)", letterSpacing: "0.03em" }}>
            {photo.caption}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Portrait image (for asymmetric pairs) ───────────────────

function CinematicPortraitImage({
  photo,
  index,
  surface,
  body,
  onClick,
}: {
  photo: { src: string; caption: string | null };
  index: number;
  surface: string;
  body: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        aspectRatio: "3/4",
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
        loading="lazy"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: hovered ? "scale(1.02)" : "scale(1)",
          pointerEvents: "none",
          userSelect: "none",
        } as React.CSSProperties}
      />
      {photo.caption && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "2rem 1.5rem 1.25rem",
            background: "linear-gradient(to top, rgba(14,16,16,0.7), transparent)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.3s",
            pointerEvents: "none",
          }}
        >
          <p style={{ fontFamily: body, fontSize: "0.65rem", color: "rgba(228,226,222,0.8)", letterSpacing: "0.03em" }}>
            {photo.caption}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── About section — grid layout ─────────────────────────────

function CinematicAbout({
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
        maxWidth: 700,
        margin: "0 auto",
        padding: "5rem 3rem",
      }}
    >
      <div
        className="cinematic-about-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr",
          gap: "0 3rem",
        }}
      >
        <div style={{ fontFamily: body, fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.15em", color: accent, paddingTop: "0.3rem" }}>
          About
        </div>
        <div>
          {profile.bio && (
            <p style={{ fontSize: "0.8rem", lineHeight: 1.8, color: muted, marginBottom: "2rem" }}>
              {profile.bio}
            </p>
          )}
          {!profile.bio && <div style={{ marginBottom: "2rem" }} />}
        </div>

        <div style={{ fontFamily: body, fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.15em", color: accent, paddingTop: "0.3rem" }}>
          Contact
        </div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {profile.email_public && (
            <a href={`mailto:${profile.email_public}`} style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: accent, textDecoration: "none", borderBottom: "1px solid transparent", paddingBottom: 2 }}>
              Email
            </a>
          )}
          {profile.instagram_handle && (
            <a href={`https://instagram.com/${profile.instagram_handle}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: accent, textDecoration: "none", borderBottom: "1px solid transparent", paddingBottom: 2 }}>
              Instagram
            </a>
          )}
          {profile.website_url && (
            <a href={profile.website_url.startsWith("http") ? profile.website_url : `https://${profile.website_url}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: accent, textDecoration: "none", borderBottom: "1px solid transparent", paddingBottom: 2 }}>
              Website
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
