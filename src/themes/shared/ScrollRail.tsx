"use client";

// ─── Scroll rail ─────────────────────────────────────────────────────
// A horizontal scroll-snap carousel for photo collections: CSS-only
// scrolling (swipe on touch), with prev/next buttons layered on top for
// pointer users. Deliberately small frames — large-photo layouts stay
// vertical on phones by product rule; the rail is for sheets and strips.

import { useRef } from "react";

export function ScrollRail({
  children,
  gapClass = "gap-4",
  className = "",
  ariaLabel = "Photo rail",
}: {
  children: React.ReactNode[];
  gapClass?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const track = useRef<HTMLDivElement>(null);

  const nudge = (direction: 1 | -1) => {
    const node = track.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className={`relative ${className}`} role="region" aria-label={ariaLabel}>
      <div
        ref={track}
        className={`flex ${gapClass} overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:thin]`}
        style={{ scrollbarColor: "var(--sh-border) transparent" }}
      >
        {children.map((child, i) => (
          <div key={i} className="snap-start shrink-0">
            {child}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => nudge(-1)}
        aria-label="Scroll back"
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 items-center justify-center border bg-[var(--sh-bg)] text-[var(--sh-text)] hover:text-[var(--sh-accent)] transition-colors"
        style={{ borderColor: "var(--sh-border)" }}
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => nudge(1)}
        aria-label="Scroll forward"
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-9 h-9 items-center justify-center border bg-[var(--sh-bg)] text-[var(--sh-text)] hover:text-[var(--sh-accent)] transition-colors"
        style={{ borderColor: "var(--sh-border)" }}
      >
        →
      </button>
    </div>
  );
}
