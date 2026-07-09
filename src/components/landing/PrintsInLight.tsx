"use client";

// ─── Prints in the light: scroll-parallax spread ─────────────────────
// The whole shoot laid out as physical prints drifting at different
// speeds, each casting a long slanted shadow. One rAF-throttled scroll
// handler drives a single CSS variable per print. Inert under reduced
// motion (prints simply sit still).

import { useEffect, useRef } from "react";

interface PrintSpec {
  src: string;
  alt: string;
  caption: string;
  /** Percent-based placement inside the tall stage. */
  style: React.CSSProperties;
  /** Parallax speed multiplier (positive drifts up slower). */
  speed: number;
  width: string;
  rotate: string;
}

const PRINTS: PrintSpec[] = [
  {
    src: "/landing/street.jpg",
    alt: "Two long pedestrian shadows on golden pavement",
    caption: "№ 03 · 17:58 · the walk home",
    style: { left: "2%", top: "4%" },
    speed: 0.5,
    width: "34%",
    rotate: "-2deg",
  },
  {
    src: "/landing/alley.jpg",
    alt: "A sun-washed alley with a diagonal band of light",
    caption: "№ 04 · 18:12 · the alley",
    style: { left: "44%", top: "0%" },
    speed: 1.2,
    width: "24%",
    rotate: "1.5deg",
  },
  {
    src: "/landing/botanical.jpg",
    alt: "Olive branch shadows on a warm plaster wall",
    caption: "№ 05 · 18:26 · the wall",
    style: { right: "3%", top: "10%" },
    speed: 0.8,
    width: "26%",
    rotate: "-1deg",
  },
  {
    src: "/landing/hands.jpg",
    alt: "Hands holding a stack of prints in evening light",
    caption: "№ 06 · 18:41 · what stays",
    style: { left: "12%", top: "46%" },
    speed: 1.5,
    width: "30%",
    rotate: "1deg",
  },
  {
    src: "/landing/study.jpg",
    alt: "A desk of prints under the last shaft of dusk light",
    caption: "№ 07 · 19:03 · the study",
    style: { right: "14%", top: "52%" },
    speed: 0.65,
    width: "36%",
    rotate: "-1.5deg",
  },
];

export function PrintsInLight() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = stageRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const viewport = window.innerHeight;
        // 0 when the stage is centred in the viewport; ±1 at the edges.
        const p = 1 - (2 * (rect.top + rect.height / 2)) / (viewport + rect.height);
        el.style.setProperty("--drift", p.toFixed(4));
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="border-t border-rule overflow-hidden">
      <div className="max-w-[1100px] mx-auto px-6 md:px-12 pt-20 md:pt-28">
        <p className="section-label flex items-center gap-2.5 mb-4">
          <span aria-hidden className="block w-4 h-px bg-accent -rotate-[18deg]" />
          from one evening
        </p>
        <h2 className="font-heading text-[clamp(30px,5vw,40px)] font-light italic leading-tight text-foreground [text-wrap:balance] max-w-xl">
          The hour touches everything worth keeping.
        </h2>
      </div>

      {/* Desktop spread */}
      <div
        ref={stageRef}
        className="relative hidden md:block max-w-[1100px] mx-auto px-6 md:px-12 h-[110vh] my-8"
      >
        {PRINTS.map((print) => (
          <figure
            key={print.src}
            className="print-drift absolute bg-background border border-rule p-1.5"
            style={
              {
                ...print.style,
                width: print.width,
                "--speed": print.speed,
                "--rot": print.rotate,
              } as React.CSSProperties
            }
          >
            <span aria-hidden className="print-shadow" />
            <div className="relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={print.src} alt={print.alt} loading="lazy" className="w-full h-auto" />
            </div>
            <figcaption className="mt-1.5 px-0.5 text-[8px] uppercase tracking-[0.3em] text-muted/50 font-body">
              {print.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Mobile: simple two-column tumble */}
      <div className="md:hidden grid grid-cols-2 gap-4 px-6 py-10">
        {PRINTS.map((print) => (
          <figure key={print.src} className="bg-background border border-rule p-1" style={{ rotate: print.rotate }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={print.src} alt={print.alt} loading="lazy" className="w-full h-auto" />
            <figcaption className="mt-1 px-0.5 text-[7px] uppercase tracking-[0.25em] text-muted/50 font-body">
              {print.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
