"use client";

// ─── The hour of themes: one shoot, eight designed objects ───────────
// A scroll-driven theatre: the viewport pins while scroll re-develops
// the same golden-hour shoot through the eight theme identities. Each
// stage is marketing chrome (mat, film strip, tape, letterbox, label,
// postcard, riso card, engraved plate) in the theme's real display font — the
// live product render sits right below in the ThemeShowcase, and the
// annotation says so honestly.
//
// Small screens and reduced-motion users get the same cards as a
// horizontal snap strip instead of the pinned theatre.

import { useEffect, useRef, useState } from "react";

interface Stage {
  id: string;
  name: string;
  /** CSS font-family for the theme's display face (loaded globally). */
  font: string;
  line: string;
  img: string;
  alt: string;
  /** Which chrome the card wears. */
  chrome:
    | "mat"
    | "filmstrip"
    | "tape"
    | "letterbox"
    | "label"
    | "postcard"
    | "riso"
    | "plate";
}

const STAGES: Stage[] = [
  {
    id: "monograph",
    name: "Monograph",
    font: "var(--font-cormorant), serif",
    line: "An editorial monograph. Strong type, generous silence.",
    img: "/landing/portrait.jpg",
    alt: "Portrait in window light, framed like an editorial monograph",
    chrome: "mat",
  },
  {
    id: "roll36",
    name: "Roll 36",
    font: "var(--font-dm-mono), monospace",
    line: "A contact sheet. Frame numbers, archival notes, the whole roll.",
    img: "/landing/dunes.jpg",
    alt: "Dunes at sunset inside a film strip frame",
    chrome: "filmstrip",
  },
  {
    id: "keepsake",
    name: "Keepsake",
    font: "var(--font-caveat), cursive",
    line: "A scrapbook page. Paper, tape, a line in your own hand.",
    img: "/landing/wedding.jpg",
    alt: "Wedding photograph taped into a scrapbook",
    chrome: "tape",
  },
  {
    id: "afterdark",
    name: "After Dark",
    font: "var(--font-space-grotesk), sans-serif",
    line: "A dark cinema. Letterboxed frames, chapter cards.",
    img: "/landing/study.jpg",
    alt: "A dusk-lit desk of prints, letterboxed like a film still",
    chrome: "letterbox",
  },
  {
    id: "cabinet",
    name: "Cabinet",
    font: "var(--font-libre-baskerville), serif",
    line: "A museum catalogue. Index numbers, archival labels, quiet.",
    img: "/landing/hands.jpg",
    alt: "Hands holding prints, catalogued like a museum object",
    chrome: "label",
  },
  {
    id: "riviera",
    name: "Riviera",
    font: "var(--font-fraunces), serif",
    line: "A postcard from the coast. Sun-washed, stamped, sent.",
    img: "/landing/alley.jpg",
    alt: "A sunlit alley presented as a postcard",
    chrome: "postcard",
  },
  {
    id: "klaxon",
    name: "Klaxon",
    font: "var(--font-archivo), sans-serif",
    line: "A risograph zine. Loud ink, index tables, no apologies.",
    img: "/landing/street.jpg",
    alt: "Long street shadows printed like a risograph poster",
    chrome: "riso",
  },
  {
    id: "verdigris",
    name: "Verdigris",
    font: "var(--font-spectral), serif",
    line: "A botanical dusk. Engraved plates, a quiet green patina.",
    img: "/landing/verdigris.jpg",
    alt: "Dusk light through a conservatory, set as an engraved botanical plate",
    chrome: "plate",
  },
];

function pad(n: number): string {
  return String(n + 1).padStart(2, "0");
}

/** The framed photograph, wearing one theme's chrome. */
function StageCard({ stage }: { stage: Stage }) {
  switch (stage.chrome) {
    case "mat":
      return (
        <div className="bg-[#efe9df] p-[7%] pb-[12%] max-h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stage.img} alt={stage.alt} loading="lazy" className="w-full h-auto max-h-[46vh] object-contain" />
          <p className="mt-[5%] text-center text-[11px] italic text-[#3d372e]" style={{ fontFamily: stage.font }}>
            the slanted hour, plate i
          </p>
        </div>
      );
    case "filmstrip":
      return (
        <div className="bg-[#0d0c0a] px-2 py-6 relative">
          <span aria-hidden className="sprockets top-1.5" />
          <span aria-hidden className="sprockets bottom-1.5" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stage.img} alt={stage.alt} loading="lazy" className="w-full h-auto max-h-[44vh] object-contain" />
          <p className="absolute bottom-1 right-3 text-[9px] tracking-[0.2em] text-[#c8b78a]" style={{ fontFamily: stage.font }}>
            24A &rarr; 25
          </p>
        </div>
      );
    case "tape":
      return (
        <div className="relative bg-[#f3ead9] p-[6%] pb-[10%] rotate-[1.2deg] shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
          <span aria-hidden className="tape -top-2.5 left-[12%] -rotate-[8deg]" />
          <span aria-hidden className="tape -top-2.5 right-[12%] rotate-[6deg]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stage.img} alt={stage.alt} loading="lazy" className="w-full h-auto max-h-[44vh] object-contain" />
          <p className="mt-[4%] text-center text-[19px] text-[#4a3f2e] -rotate-[1.5deg]" style={{ fontFamily: stage.font }}>
            the light was perfect that evening
          </p>
        </div>
      );
    case "letterbox":
      return (
        <div className="bg-black py-[9%] px-0 relative">
          <div className="overflow-hidden aspect-[21/9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stage.img} alt={stage.alt} loading="lazy" className="w-full h-full object-cover" />
          </div>
          <p className="absolute bottom-[3%] left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.35em] text-[#8f8a83]" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
            ch. 04 · the last light
          </p>
        </div>
      );
    case "label":
      return (
        <div className="bg-[#e9e4da] p-[8%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stage.img} alt={stage.alt} loading="lazy" className="w-full h-auto max-h-[42vh] object-contain" />
          <div className="mt-[6%] mx-auto w-fit border border-[#b5ad9e] bg-[#f2ede4] px-4 py-2 text-center">
            <p className="text-[10px] tracking-[0.18em] uppercase text-[#57503f]" style={{ fontFamily: "var(--font-dm-mono), monospace" }}>
              cat. № 112
            </p>
            <p className="text-[12px] italic text-[#3f3a2f]" style={{ fontFamily: stage.font }}>
              Prints held to the evening sun
            </p>
          </div>
        </div>
      );
    case "postcard":
      return (
        <div className="relative bg-[#f6f1e6] p-[5%] pb-[7%] -rotate-[1.5deg] shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stage.img} alt={stage.alt} loading="lazy" className="w-full h-auto max-h-[44vh] object-contain saturate-[1.12]" />
          <span aria-hidden className="absolute top-[7%] right-[7%] w-9 h-11 border border-[#c2531f]/60 bg-[#c2531f]/10" />
          <span aria-hidden className="absolute top-[6%] right-[16%] w-12 h-12 rounded-full border border-[#57503f]/30 rotate-[14deg]" />
          <p className="absolute bottom-[2.5%] left-[6%] text-[15px] italic text-[#6b4a2f]" style={{ fontFamily: stage.font }}>
            wish you were here
          </p>
        </div>
      );
    case "riso":
      return (
        <div className="relative bg-[#171310] border-[3px] border-accent p-[4%] shadow-[10px_10px_0_rgba(255,107,0,0.28)]">
          <div className="relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stage.img} alt={stage.alt} loading="lazy" className="w-full h-auto max-h-[44vh] object-contain contrast-[1.15]" />
            <span aria-hidden className="absolute inset-0 bg-accent/15 mix-blend-screen" />
          </div>
          <p className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.2em] text-accent" style={{ fontFamily: stage.font }}>
            <span>idx 07</span>
            <span>golden hr</span>
            <span>2 up</span>
          </p>
        </div>
      );
    case "plate":
      return (
        <div className="relative bg-[#22382c] p-[7%] pb-[5%]">
          {/* Filigree double rule, engraved into the plate */}
          <span aria-hidden className="pointer-events-none absolute inset-[3%] border border-[#8fc7a4]/30" />
          <span aria-hidden className="pointer-events-none absolute inset-[4.2%] border border-[#8fc7a4]/15" />
          <div className="relative mx-auto w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stage.img} alt={stage.alt} loading="lazy" className="block w-auto h-auto max-h-[42vh]" />
          </div>
          <div className="mt-[5%] mb-[2%] text-center">
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#8fc7a4]/80" style={{ fontFamily: "var(--font-dm-mono), monospace" }}>
              pl. viii
            </p>
            <p className="mt-1 text-[13px] italic text-[#eae3cf]" style={{ fontFamily: stage.font }}>
              Olea europaea · gathered at the last hour
            </p>
          </div>
        </div>
      );
  }
}

function StagePanel({ stage, index }: { stage: Stage; index: number }) {
  return (
    <div className="grid md:grid-cols-[1fr_minmax(0,520px)] gap-8 md:gap-16 items-center w-full max-w-[1100px] mx-auto px-6 md:px-12">
      <div>
        <p className="text-[10px] uppercase tracking-label text-muted/70 font-body mb-4 tabular-nums">
          {pad(index)} / {pad(STAGES.length - 1)}
        </p>
        <h3
          className="text-[clamp(40px,7vw,84px)] leading-[0.95] text-foreground font-light"
          style={{ fontFamily: stage.font }}
        >
          {stage.name}
        </h3>
        <p className="mt-5 font-copy text-base md:text-lg text-muted max-w-[380px] leading-relaxed">
          {stage.line}
        </p>
      </div>
      <div className="min-w-0">
        <StageCard stage={stage} />
      </div>
    </div>
  );
}

export function HourOfThemes() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Which layout shows is decided entirely by CSS (breakpoint +
  // motion-reduce variants), so SSR, hydration, and window resizes can
  // never disagree. This handler simply goes quiet while the theatre is
  // display:none (its rect collapses).
  useEffect(() => {
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrapRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        if (total <= 0) return;
        const progress = Math.min(1, Math.max(0, -rect.top / total));
        const next = Math.min(STAGES.length - 1, Math.floor(progress * STAGES.length));
        setActive(next);
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
    <section id="hour" className="border-t border-rule scroll-mt-24">
      <div className="max-w-[1100px] mx-auto px-6 md:px-12 pt-20 md:pt-28 pb-4 text-center">
        <p className="section-label mb-4 flex items-center justify-center gap-2.5">
          <span aria-hidden className="block w-4 h-px bg-accent -rotate-[18deg]" />
          the hour passes
          <span aria-hidden className="block w-4 h-px bg-accent -rotate-[18deg]" />
        </p>
        <h2 className="font-heading text-[clamp(30px,5vw,40px)] font-light italic leading-tight text-foreground [text-wrap:balance]">
          One golden hour. Eight designed objects.
        </h2>
        <p className="mt-4 font-copy text-[15px] text-muted max-w-md mx-auto">
          Keep scrolling: the same photographs, re-set by every theme. Switching never
          loses a thing.
        </p>
      </div>

      {/* ── Pinned theatre (md+, hidden under reduced motion) ── */}
      <div
        ref={wrapRef}
        style={{ height: `${STAGES.length * 62}vh` }}
        className="relative hidden md:block md:motion-reduce:hidden"
      >
        <div className="sticky top-0 h-screen overflow-hidden flex items-center">
            {/* Slanted light wipe on each stage change */}
            <span key={active} aria-hidden className="hour-wipe" />
            {STAGES.map((stage, i) => (
              <div
                key={stage.id}
                aria-hidden={i !== active}
                className={`absolute inset-0 flex items-center transition-all duration-700 ease-out ${
                  i === active
                    ? "opacity-100 translate-y-0"
                    : i < active
                      ? "opacity-0 -translate-y-6 pointer-events-none"
                      : "opacity-0 translate-y-6 pointer-events-none"
                }`}
              >
                <StagePanel stage={stage} index={i} />
              </div>
            ))}
          </div>
      </div>

      {/* ── Snap strip (small screens; also md+ under reduced motion) ── */}
      <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory flex gap-6 px-6 py-10 md:hidden md:motion-reduce:flex">
          {STAGES.map((stage, i) => (
            <div key={stage.id} className="snap-center shrink-0 w-[84vw] max-w-[420px]">
              <p className="text-[10px] uppercase tracking-label text-muted/70 font-body mb-3 tabular-nums">
                {pad(i)} / {pad(STAGES.length - 1)}
              </p>
              <StageCard stage={stage} />
              <h3 className="mt-4 text-3xl text-foreground font-light" style={{ fontFamily: stage.font }}>
                {stage.name}
              </h3>
              <p className="mt-2 font-copy text-sm text-muted leading-relaxed">{stage.line}</p>
            </div>
          ))}
      </div>

      <div className="max-w-[1100px] mx-auto px-6 md:px-12 pb-16 md:pb-20 text-center">
        <p className="text-[10px] uppercase tracking-label text-muted/60 font-body">
          identities above · the real renderer below &darr;
        </p>
      </div>
    </section>
  );
}
