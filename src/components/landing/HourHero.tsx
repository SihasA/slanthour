"use client";

// ─── Hero print composition: the slanted hour ────────────────────────
// Physical prints catching a slow sweep of golden-hour light. The beam
// is pure CSS (.light-sweep in globals.css); this component adds the
// pointer tilt: prints behave like paper on a wall, angling a few
// degrees toward the cursor. Touch devices and reduced-motion users get
// the still composition with the CSS sweep alone.

import { useEffect, useRef } from "react";

interface HourHeroProps {
  className?: string;
}

export function HourHero({ className = "" }: HourHeroProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    function onMove(event: PointerEvent) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty("--tilt-x", `${(-y * 5).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${(x * 6).toFixed(2)}deg`);
        el.style.setProperty("--sheen-x", `${(x * 40 + 50).toFixed(1)}%`);
      });
    }
    function onLeave() {
      cancelAnimationFrame(raf);
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
    }
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={`relative pb-16 hour-tilt ${className}`}>
      {/* The slant: an accent rule crossing behind the prints */}
      <span
        aria-hidden
        className="absolute left-[-12%] right-[-6%] top-[46%] h-px bg-accent/35 -rotate-[14deg]"
      />

      {/* Main print: the window portrait */}
      <div
        className="hour-print relative w-[68%] ml-auto border border-rule bg-background p-1.5 photo-in"
        style={{ "--rise-delay": "250ms", "--print-depth": "1" } as React.CSSProperties}
      >
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/portrait.jpg"
            alt="A portrait lit by one shaft of golden-hour window light"
            width={1066}
            height={1600}
            fetchPriority="high"
            className="w-full h-auto"
          />
          <span aria-hidden className="light-sweep" />
        </div>
        <p className="mt-1.5 px-0.5 text-right text-[8px] uppercase tracking-[0.3em] text-muted/50 font-body">
          18:47 · the slanted hour
        </p>
      </div>

      {/* Companion print: the wedding, lower left */}
      <div
        className="hour-print absolute left-0 bottom-0 w-[56%] bg-background p-1.5 border border-rule photo-in"
        style={{ "--rise-delay": "420ms", "--print-depth": "1.6" } as React.CSSProperties}
      >
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/wedding.jpg"
            alt="A couple backlit by low golden sun, the veil catching the light"
            width={1600}
            height={1066}
            className="w-full h-auto"
          />
          <span aria-hidden className="light-sweep [animation-delay:-6s]" />
        </div>
        <p className="mt-1.5 px-0.5 text-[8px] uppercase tracking-[0.3em] text-muted/50 font-body">
          № 02 · the same hour, kept
        </p>
      </div>

      {/* Small print: dunes, tucked top-left behind */}
      <div
        className="hour-print absolute left-[8%] -top-4 w-[34%] bg-background p-1 border border-rule photo-in"
        style={{ "--rise-delay": "560ms", "--print-depth": "2.4", rotate: "-2deg" } as React.CSSProperties}
      >
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/dunes.jpg"
            alt="Dune grass casting long shadows at the last hour of sun"
            width={1600}
            height={1066}
            loading="lazy"
            className="w-full h-auto"
          />
          <span aria-hidden className="light-sweep [animation-delay:-11s]" />
        </div>
      </div>

    </div>
  );
}
