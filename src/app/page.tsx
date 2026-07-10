import Link from "next/link";
import { ThemeShowcase } from "@/components/landing/ThemeShowcase";
import { MobileCta } from "@/components/landing/MobileCta";
import { Reveal } from "@/components/landing/Reveal";
import { THEME_IDS } from "@/themes/registry";

// ─── The calm homepage: a gallery at closing time ─────────────────────
// One photograph, a few words, one door in. The live renderer does the
// convincing; the copy stays out of the way.

const ASSURANCES = [
  "Your photographs stay yours",
  "No ads, no trackers, EXIF stripped",
  "Published pages stay up",
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Slanthour",
  url: "https://slanthour.com",
  applicationCategory: "DesignApplication",
  description:
    "Turns collections of photographs into designed, shareable web pages: a designed object, not a feed.",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
    { "@type": "Offer", name: "Pro", price: "7", priceCurrency: "USD" },
    { "@type": "Offer", name: "Studio", price: "18", priceCurrency: "USD" },
    { "@type": "Offer", name: "Keepsake page", price: "39", priceCurrency: "USD" },
  ],
};

export default function LandingPage() {
  const themeCount = THEME_IDS.length;
  const themeCountWord =
    ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"][themeCount] ??
    String(themeCount);

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      {/* Film grain over the whole page — printed, not rendered. */}
      <div aria-hidden className="grain fixed inset-0 z-[70] pointer-events-none opacity-[0.13] mix-blend-soft-light" />

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 bg-background/90 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 py-5">
          <img src="/brand/logo-light.svg" alt="Slanthour" className="h-7 sm:h-8 w-auto shrink-0" />
          <nav className="flex items-center gap-5 md:gap-8 whitespace-nowrap">
            <Link
              href="/pricing"
              className="text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-[10px] uppercase tracking-wide text-accent hover:text-foreground transition-colors"
            >
              Create
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero: a few words, then the photograph ──────────── */}
      <section id="hero" className="pt-36 md:pt-48 px-6 md:px-12">
        <div className="max-w-[820px] mx-auto text-center">
          <div className="rise-in" style={{ "--rise-delay": "0ms" } as React.CSSProperties}>
            <p className="section-label flex items-center justify-center gap-2.5 mb-6 md:mb-8">
              <span aria-hidden className="block w-4 h-px bg-accent -rotate-[18deg]" />
              Pages for photographs
              <span aria-hidden className="block w-4 h-px bg-accent -rotate-[18deg]" />
            </p>
          </div>
          <h1 className="font-heading text-[clamp(38px,6vw,76px)] font-light leading-[0.98] tracking-tight text-foreground mb-7 md:mb-9 [text-wrap:balance]">
            <span className="block rise-in" style={{ "--rise-delay": "90ms" } as React.CSSProperties}>
              A home for photos
            </span>
            <em
              className="block text-muted rise-in"
              style={{ "--rise-delay": "200ms" } as React.CSSProperties}
            >
              that deserve more than a post.
            </em>
          </h1>
          <p
            className="font-copy text-base md:text-lg text-muted leading-relaxed mb-9 md:mb-11 rise-in"
            style={{ "--rise-delay": "320ms" } as React.CSSProperties}
          >
            One collection becomes one quietly designed page. Not a feed.
          </p>
          <div
            className="flex flex-wrap items-center justify-center gap-6 rise-in"
            style={{ "--rise-delay": "430ms" } as React.CSSProperties}
          >
            <Link
              href="/signup"
              className="group inline-flex items-center gap-3 px-8 py-4 text-[10px] uppercase tracking-wide text-background bg-foreground hover:bg-accent transition-all duration-200 hover:-translate-y-px"
            >
              Create a page{" "}
              <span className="text-sm transition-transform duration-200 group-hover:translate-x-0.5">
                &rarr;
              </span>
            </Link>
            <Link
              href="/demo"
              className="draw-link text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors"
            >
              See a live page
            </Link>
          </div>
        </div>

        <figure
          className="max-w-[1200px] mx-auto mt-14 md:mt-20 photo-in"
          style={{ "--rise-delay": "520ms" } as React.CSSProperties}
        >
          <div className="relative aspect-[3/2] md:aspect-[21/10] border border-rule overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/wedding.jpg"
              alt="A couple backlit by low golden sun, the veil catching the light"
              width={1600}
              height={1066}
              fetchPriority="high"
              className="w-full h-full object-cover slow-drift"
            />
            <span aria-hidden className="light-sweep" />
          </div>
          <figcaption className="mt-3 flex items-center justify-between text-[9px] uppercase tracking-label text-muted/60 font-body">
            <span>№ 01 · the slanted hour</span>
            <span>18:47</span>
          </figcaption>
        </figure>
      </section>

      {/* ── The proof: the real renderer, live ──────────────── */}
      <section id="themes" className="mt-20 md:mt-28 border-t border-rule scroll-mt-24">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-28">
          <Reveal>
            <div className="text-center mb-10">
              <p className="section-label mb-4 flex items-center justify-center gap-2.5">
                <span aria-hidden className="block w-4 h-px bg-accent -rotate-[18deg]" />
                {themeCountWord} themes
                <span aria-hidden className="block w-4 h-px bg-accent -rotate-[18deg]" />
              </p>
              <h2 className="font-heading text-[clamp(30px,5vw,40px)] font-light italic leading-tight text-foreground [text-wrap:balance]">
                The real renderer, right here.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <ThemeShowcase />
          </Reveal>
        </div>
      </section>

      {/* ── The close: one sentence, three promises, one door ── */}
      <section className="border-t border-rule">
        <div className="max-w-[820px] mx-auto px-6 md:px-12 py-24 md:py-32 text-center">
          <Reveal>
            <p className="font-copy text-base md:text-lg text-muted leading-loose">
              Upload a collection. Arrange the sections. Publish at{" "}
              <span className="text-foreground/80 whitespace-nowrap">
                slanthour.com/you/page-name
              </span>
              .
            </p>
          </Reveal>
          <Reveal delay={100}>
            <ul className="mt-12 mb-16 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
              {ASSURANCES.map((line) => (
                <li
                  key={line}
                  className="flex items-center gap-2.5 text-[9px] font-body uppercase tracking-label text-muted/70"
                >
                  <span aria-hidden className="block w-3 h-px bg-accent/70 -rotate-[18deg]" />
                  {line}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={200}>
            <h2 className="font-heading text-[clamp(32px,5vw,48px)] font-light italic leading-tight text-foreground mb-9 [text-wrap:balance]">
              Make one this evening.
            </h2>
            <div className="flex flex-col items-center gap-5">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-3 px-8 py-4 text-[10px] uppercase tracking-wide text-background bg-foreground hover:bg-accent transition-all duration-200 hover:-translate-y-px"
              >
                Create a page{" "}
                <span className="text-sm transition-transform duration-200 group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </Link>
              <p className="font-copy text-sm text-muted/60">
                Free to start &middot; No credit card &middot;{" "}
                <Link
                  href="/pricing"
                  className="underline underline-offset-2 hover:text-muted transition-colors"
                >
                  Full pricing
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-rule px-6 md:px-12 py-7 flex flex-col md:flex-row justify-between items-center gap-3">
        <img src="/brand/logo-light.svg" alt="Slanthour" className="h-6 w-auto opacity-50" />
        <nav className="flex items-center gap-6">
          <Link href="/demo" className="text-[9px] uppercase tracking-wide text-muted/60 hover:text-muted transition-colors">
            Demo
          </Link>
          <Link href="/pricing" className="text-[9px] uppercase tracking-wide text-muted/60 hover:text-muted transition-colors">
            Pricing
          </Link>
          <Link href="/privacy" className="text-[9px] uppercase tracking-wide text-muted/60 hover:text-muted transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="text-[9px] uppercase tracking-wide text-muted/60 hover:text-muted transition-colors">
            Terms
          </Link>
        </nav>
        <span className="text-[9px] tracking-wide text-muted/50">&copy; 2026 Slanthour</span>
      </footer>

      <MobileCta />
    </div>
  );
}
