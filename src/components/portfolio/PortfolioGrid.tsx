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
      <div className="grid grid-cols-3 gap-[3px] md:gap-[3px]">
        {photos.map((photo, i) => (
          <button
            key={i}
            onClick={() => setLightboxIndex(i)}
            className="aspect-square overflow-hidden group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={photo.caption || ""}
              loading={i < 3 ? "eager" : "lazy"}
              draggable={false}
              className="w-full h-full object-cover select-none transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.04] group-hover:brightness-[0.7]"
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
