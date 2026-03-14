"use client";

import { useState } from "react";

interface PortfolioAboutProps {
  displayName: string;
  bio: string | null;
  emailPublic: string | null;
  instagramHandle: string | null;
  websiteUrl: string | null;
}

export function PortfolioAbout({
  displayName,
  bio,
  emailPublic,
  instagramHandle,
  websiteUrl,
}: PortfolioAboutProps) {
  const hasContact = emailPublic || instagramHandle || websiteUrl;

  if (!bio && !hasContact) return null;

  return (
    <>
      <section
        className="about-section"
        style={{
          borderTop: "1px solid #222120",
          maxWidth: 1100,
          margin: "0 auto",
          padding: "80px 48px 120px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 80,
          alignItems: "start",
        }}
      >
        {/* About text */}
        <div>
          <p
            style={{
              fontSize: 9,
              letterSpacing: "0.35em",
              textTransform: "uppercase" as const,
              color: "#9c8e7a",
              marginBottom: 24,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            About
          </p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 36,
              fontWeight: 300,
              fontStyle: "italic",
              lineHeight: 1.2,
              color: "#e8e4df",
              marginBottom: 20,
            }}
          >
            {displayName}
          </h2>
          {bio && (
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 17,
                lineHeight: 1.8,
                color: "#6b6760",
              }}
            >
              {bio}
            </p>
          )}
        </div>

        {/* Contact links */}
        {hasContact && (
          <div id="contact">
            <p
              style={{
                fontSize: 9,
                letterSpacing: "0.35em",
                textTransform: "uppercase" as const,
                color: "#9c8e7a",
                marginBottom: 24,
                fontFamily: "'DM Mono', monospace",
              }}
            >
              Contact
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column" as const,
                marginTop: 32,
              }}
            >
              {emailPublic && (
                <ContactLink
                  href={`mailto:${emailPublic}`}
                  label="Email"
                  value={emailPublic}
                />
              )}
              {instagramHandle && (
                <ContactLink
                  href={`https://instagram.com/${instagramHandle}`}
                  label="Instagram"
                  value={`@${instagramHandle}`}
                />
              )}
              {websiteUrl && (
                <ContactLink
                  href={
                    websiteUrl.startsWith("http")
                      ? websiteUrl
                      : `https://${websiteUrl}`
                  }
                  label="Website"
                  value={websiteUrl.replace(/^https?:\/\//, "")}
                />
              )}
            </div>
          </div>
        )}
      </section>

      {/* Responsive override */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 768px) {
              .about-section {
                grid-template-columns: 1fr !important;
                gap: 48px !important;
                padding: 60px 24px 80px !important;
              }
            }
          `,
        }}
      />
    </>
  );
}

function ContactLink({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: hovered ? 24 : 16,
        textDecoration: "none",
        color: "#e8e4df",
        padding: "16px 0",
        borderTop: "1px solid #222120",
        transition: "gap 0.2s ease",
      }}
    >
      <span
        style={{
          fontSize: 9,
          letterSpacing: "0.25em",
          textTransform: "uppercase" as const,
          color: "#6b6760",
          minWidth: 80,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 18,
          fontStyle: "italic",
        }}
      >
        {value}
      </span>
      <span
        style={{
          marginLeft: "auto",
          fontSize: 16,
          color: "#9c8e7a",
          transition: "transform 0.2s ease",
          transform: hovered ? "translateX(4px)" : "translateX(0)",
        }}
      >
        &rarr;
      </span>
    </a>
  );
}
