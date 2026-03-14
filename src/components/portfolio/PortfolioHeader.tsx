"use client";

import { useState, useEffect, useCallback } from "react";

interface PortfolioHeaderProps {
  displayName: string;
  hasBio: boolean;
  hasBanner: boolean;
  headingFamily: string;
  bodyFamily: string;
  textColor: string;
  mutedColor: string;
  bgColor: string;
  headerBg: string;
  ruleColor: string;
}

export function PortfolioHeader({
  displayName,
  hasBio,
  hasBanner,
  headingFamily,
  bodyFamily,
  textColor,
  mutedColor,
  headerBg,
  ruleColor,
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

  // Determine colours based on scroll state
  const showWhiteText = hasBanner && overBanner && !scrolled;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] flex justify-between items-center transition-[background,border-color] duration-300 ease-out"
      style={{
        padding: "24px 48px",
        background: scrolled ? headerBg : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: `1px solid ${scrolled ? ruleColor : "transparent"}`,
      }}
    >
      {/* Logo / Name */}
      <a
        href="#"
        className="no-underline transition-colors duration-200"
        style={{
          fontFamily: headingFamily,
          fontSize: "20px",
          fontStyle: "italic",
          fontWeight: 300,
          letterSpacing: "0.02em",
          color: showWhiteText ? "rgba(255,255,255,0.85)" : textColor,
        }}
      >
        {displayName.split(" ")[0]}
      </a>

      {/* Nav links */}
      <nav className="flex items-center" style={{ gap: "32px" }}>
        <NavLink
          href="#work"
          label="Work"
          bodyFamily={bodyFamily}
          textColor={textColor}
          mutedColor={mutedColor}
          isWhite={showWhiteText}
        />
        {hasBio && (
          <NavLink
            href="#about"
            label="About"
            bodyFamily={bodyFamily}
            textColor={textColor}
            mutedColor={mutedColor}
            isWhite={showWhiteText}
          />
        )}
      </nav>
    </header>
  );
}

function NavLink({
  href,
  label,
  bodyFamily,
  textColor,
  mutedColor,
  isWhite,
}: {
  href: string;
  label: string;
  bodyFamily: string;
  textColor: string;
  mutedColor: string;
  isWhite: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const color = isWhite
    ? hovered
      ? "#fff"
      : "rgba(255,255,255,0.6)"
    : hovered
      ? textColor
      : mutedColor;

  return (
    <a
      href={href}
      className="no-underline uppercase transition-colors duration-200"
      style={{
        fontSize: "10px",
        letterSpacing: "0.2em",
        color,
        fontFamily: bodyFamily,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </a>
  );
}
