"use client";

// ─── The hour meter ──────────────────────────────────────────────────
// A quiet fixed rail on the right edge: page scroll is the hour passing,
// 17:00 at the top of the page to 19:00 at the footer. One slanted tick
// travels the rail; the time reads out in DM Mono. Desktop only.

import { useEffect, useRef, useState } from "react";

function format(minutesFromFive: number): string {
  const total = 17 * 60 + Math.round(minutesFromFive);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function HourMeter() {
  const [progress, setProgress] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    function onScroll() {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="hidden lg:flex fixed right-5 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-3 pointer-events-none"
    >
      <span className="text-[8px] font-body tracking-[0.25em] text-muted/40">17:00</span>
      <div className="relative w-px h-44 bg-rule">
        <span
          className="absolute left-1/2 w-3.5 h-px bg-accent -rotate-[18deg] -translate-x-1/2 transition-[top] duration-150 ease-out"
          style={{ top: `${progress * 100}%` }}
        />
      </div>
      <span className="text-[8px] font-body tracking-[0.25em] text-muted/40">19:00</span>
      <span className="mt-1 text-[9px] font-body tracking-[0.2em] text-accent/80 tabular-nums">
        {format(progress * 120)}
      </span>
    </div>
  );
}
