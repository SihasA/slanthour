"use client";

import { useState } from "react";
import { Lightbox } from "./Lightbox";

interface GridPhoto {
  src: string;
  caption: string | null;
}

interface PortfolioGridProps {
  photos: GridPhoto[];
  accentColor: string;
}

export function PortfolioGrid({ photos, accentColor }: PortfolioGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      {/* Grid container with breathing room — matches legacy */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-6 pt-10 pb-20 md:pt-10 md:pb-32">
        {/* Meta bar */}
        <div
          className="flex justify-between items-center mb-5 pb-4"
          style={{ borderBottom: `1px solid var(--rule-color, rgba(255,255,255,0.08))` }}
        >
          <span
            className="text-[9px] uppercase tracking-[0.25em]"
            style={{ color: accentColor }}
          >
            {photos.length} photograph{photos.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-3 gap-[3px] sm:gap-[3px]">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              className="aspect-square overflow-hidden group cursor-pointer"
              style={{ background: "var(--surface-color, rgba(255,255,255,0.03))" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.caption || ""}
                loading={i < 3 ? "eager" : "lazy"}
                draggable={false}
                className="w-full h-full object-cover select-none transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.04] group-hover:brightness-[0.7] pointer-events-none"
                style={{
                  userSelect: "none",
                  WebkitTouchCallout: "none",
                  WebkitUserDrag: "none",
                } as React.CSSProperties}
                onContextMenu={(e) => e.preventDefault()}
              />
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          accentColor={accentColor}
        />
      )}
    </>
  );
}
