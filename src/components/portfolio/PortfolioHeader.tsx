"use client";

import { useState, useEffect, useCallback } from "react";

interface PortfolioHeaderProps {
  displayName: string;
  hasAbout: boolean;
  hasBanner: boolean;
}

export function PortfolioHeader({
  displayName,
  hasAbout,
  hasBanner,
}: PortfolioHeaderProps) {
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
        padding: "24px 48px",
        background: scrolled ? "rgba(15,14,13,0.88)" : "transparent",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${scrolled ? "#222120" : "transparent"}`,
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}
    >
      {/* Logo */}
      <a
        href="#"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 20,
          fontStyle: "italic",
          fontWeight: 300,
          letterSpacing: "0.02em",
          color: isOverBanner ? "rgba(255,255,255,0.85)" : "#e8e4df",
          textDecoration: "none",
        }}
      >
        {displayName.split(" ")[0]}
      </a>

      {/* Nav */}
      <nav style={{ display: "flex", gap: 32, alignItems: "center" }}>
        <HeaderLink href="#work" label="Work" isOverBanner={isOverBanner} />
        {hasAbout && (
          <HeaderLink href="#about" label="About" isOverBanner={isOverBanner} />
        )}
      </nav>
    </header>
  );
}

function HeaderLink({
  href,
  label,
  isOverBanner,
}: {
  href: string;
  label: string;
  isOverBanner: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const color = isOverBanner
    ? hovered
      ? "#fff"
      : "rgba(255,255,255,0.85)"
    : hovered
      ? "#e8e4df"
      : "#6b6760";

  return (
    <a
      href={href}
      style={{
        fontSize: 10,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color,
        textDecoration: "none",
        transition: "color 0.2s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </a>
  );
}
