"use client";

import { useState } from "react";
import { Lightbox } from "./Lightbox";

interface GridPhoto {
  src: string;
  caption: string | null;
}

interface PortfolioGridProps {
  photos: GridPhoto[];
}

export function PortfolioGrid({ photos }: PortfolioGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div
        className="grid-wrap"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 24px 120px",
        }}
      >
        {/* Meta bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: "1px solid #222120",
          }}
        >
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.25em",
              textTransform: "uppercase" as const,
              color: "#9c8e7a",
            }}
          >
            {photos.length} photograph{photos.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Photo grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 3,
          }}
        >
          {photos.map((photo, i) => (
            <GridItem
              key={i}
              photo={photo}
              index={i}
              onClick={() => setLightboxIndex(i)}
            />
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Responsive override */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 768px) {
              .grid-wrap { padding: 28px 0 80px !important; }
              .grid-wrap > div:last-child { gap: 2px !important; }
            }
          `,
        }}
      />
    </>
  );
}

function GridItem({
  photo,
  index,
  onClick,
}: {
  photo: GridPhoto;
  index: number;
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
        background: "#161514",
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
          transition:
            "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.3s ease",
          transform: hovered ? "scale(1.04)" : "scale(1)",
          filter: hovered ? "brightness(0.7)" : "brightness(1)",
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserDrag: "none",
          WebkitTouchCallout: "none",
        } as React.CSSProperties}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
