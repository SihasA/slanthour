"use client";

import { useState, useEffect, useCallback } from "react";
import type { LayoutTheme } from "@/types";

interface ThemeHeaderProps {
  displayName: string;
  hasAbout: boolean;
  hasBanner: boolean;
  variant: LayoutTheme;
  bgColor: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  headerBg: string;
  ruleColor: string;
  headingFont: string;
  bodyFont: string;
}

export function ThemeHeader({
  displayName,
  hasAbout,
  hasBanner,
  variant,
  bgColor,
  textColor,
  mutedColor,
  headerBg,
  ruleColor,
  headingFont,
  bodyFont,
}: ThemeHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [overBanner, setOverBanner] = useState(hasBanner);

  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    setScrolled(y > 20);

    if (hasBanner) {
      const banner = document.querySelector<HTMLElement>("[data-banner]");
      if (banner) {
        setOverBanner(y < banner.offsetHeight - 80);
      }
    }
  }, [hasBanner]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const isOverBanner = hasBanner && overBanner;
  const isCinematic = variant === "cinematic";

  // ─── Cinematic: mix-blend-mode difference, always white ────
  if (isCinematic) {
    return (
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 48px",
          mixBlendMode: "difference",
          color: "#fff",
          transition: "opacity 0.3s ease",
        }}
      >
        <a
          href="#"
          style={{
            fontFamily: headingFont,
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: "0.04em",
            color: "inherit",
            textDecoration: "none",
          }}
        >
          {displayName.split(" ")[0]}
        </a>
        <nav style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <CinematicLink href="#work" label="Work" bodyFont={bodyFont} />
          {hasAbout && (
            <CinematicLink href="#about" label="About" bodyFont={bodyFont} />
          )}
        </nav>
      </header>
    );
  }

  // ─── Editorial + Journal: scroll-aware ─────────────────────
  const showWhiteText = isOverBanner && !scrolled;

  const logoColor = showWhiteText ? "rgba(255,255,255,0.85)" : textColor;
  const navDefaultColor = showWhiteText ? "rgba(255,255,255,0.85)" : mutedColor;
  const navHoverColor = showWhiteText ? "#fff" : textColor;

  return (
    <header
      className="portfolio-header"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: variant === "editorial" ? "20px 40px" : "24px 48px",
        background:
          variant === "editorial"
            ? isOverBanner
              ? "linear-gradient(to bottom, rgba(10,9,8,0.9), transparent)"
              : headerBg
            : scrolled
              ? headerBg
              : "transparent",
        backdropFilter: variant === "editorial" && isOverBanner ? "none" : "blur(16px)",
        WebkitBackdropFilter: variant === "editorial" && isOverBanner ? "none" : "blur(16px)",
        // Use box-shadow instead of border-bottom so there is zero paint boundary
        // when transparent — a 1px solid transparent border still composites as a
        // hairline on GPU layers (visible against the bright banner image).
        boxShadow: scrolled && !isOverBanner ? `0 1px 0 ${ruleColor}` : "none",
        transition: "background 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      <a
        href="#"
        style={{
          fontFamily: headingFont,
          fontSize: variant === "editorial" ? "1.1rem" : 20,
          fontStyle: "italic",
          fontWeight: variant === "editorial" ? 400 : 300,
          letterSpacing: "0.02em",
          color: logoColor,
          textDecoration: "none",
        }}
      >
        {displayName.split(" ")[0]}
      </a>

      <nav style={{ display: "flex", gap: 32, alignItems: "center" }}>
        <HeaderLink
          href="#work"
          label="Work"
          bodyFont={bodyFont}
          defaultColor={navDefaultColor}
          hoverColor={navHoverColor}
          variant={variant}
        />
        {hasAbout && (
          <HeaderLink
            href="#about"
            label="About"
            bodyFont={bodyFont}
            defaultColor={navDefaultColor}
            hoverColor={navHoverColor}
            variant={variant}
          />
        )}
      </nav>
    </header>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function HeaderLink({
  href,
  label,
  bodyFont,
  defaultColor,
  hoverColor,
  variant,
}: {
  href: string;
  label: string;
  bodyFont: string;
  defaultColor: string;
  hoverColor: string;
  variant: LayoutTheme;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      style={{
        fontSize: variant === "editorial" ? "0.7rem" : 10,
        letterSpacing: variant === "editorial" ? "0.12em" : "0.2em",
        textTransform: "uppercase",
        color: hovered ? hoverColor : defaultColor,
        textDecoration: "none",
        transition: "color 0.2s ease",
        fontFamily: bodyFont,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </a>
  );
}

function CinematicLink({
  href,
  label,
  bodyFont,
}: {
  href: string;
  label: string;
  bodyFont: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      style={{
        fontSize: 10,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "inherit",
        textDecoration: "none",
        opacity: hovered ? 1 : 0.7,
        transition: "opacity 0.2s ease",
        fontFamily: bodyFont,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </a>
  );
}
