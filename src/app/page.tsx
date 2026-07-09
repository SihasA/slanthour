import Link from "next/link";
import { ThemeShowcase } from "@/components/landing/ThemeShowcase";
import { MobileCta } from "@/components/landing/MobileCta";
import { Reveal } from "@/components/landing/Reveal";
import { HourHero } from "@/components/landing/HourHero";
import { HourMeter } from "@/components/landing/HourMeter";
import { HourOfThemes } from "@/components/landing/HourOfThemes";
import { PrintsInLight } from "@/components/landing/PrintsInLight";
import { THEME_IDS } from "@/themes/registry";

const CYCLE_WORDS = ["weddings", "road trips", "portfolios", "tributes", "whole years"];

const USE_CASES = [
  "A photography series",
  "A travel diary",
  "A family archive",
  "A page about a friend",
  "A visual portfolio",
  "A wedding collection",
  "A birthday tribute",
  "A photo essay",
  "A project showcase",
];

const FAQS = [
  {
    q: "Will my photographs look worse here?",
    a: "No. Photos are served at up to 2000px through a size-aware srcset, so every screen gets the sharpest version it can display. Pro accounts add a 2560px high-fidelity variant for large monitors.",
  },
  {
    q: "Do I keep ownership of my photos?",
    a: "Always. Publishing here grants Slanthour no rights beyond serving your page. Slanthour stores presentation copies, so keep your originals as you always would.",
  },
  {
    q: "Who can see my pages?",
    a: "You choose, per page: public, unlisted (only people with the link), or password-protected. Viewers never need an account.",
  },
  {
    q: "What about metadata and privacy?",
    a: "Location and camera data (EXIF) are stripped from every photo before it leaves your browser. Published pages carry no ads, no cookies and no third-party trackers.",
  },
  {
    q: "What happens if I stop paying?",
    a: "Nothing you’ve published comes down. A lapsed plan returns you to the free tier’s limits for new pages, and a Keepsake page stays up regardless; that is the point of it.",
  },
  {
    q: "Will this site still be here in five years?",
    a: "Slanthour is deliberately small and inexpensive to run. The Keepsake promise is in the terms: ten years in writing, a downloadable archive, and a year’s notice if we ever wind down.",
  },
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

/** Section label with the slanted-tick mark — the house motif. */
function SlantLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="section-label flex items-center gap-2.5">
      <span aria-hidden className="block w-4 h-px bg-accent -rotate-[18deg]" />
      {children}
    </p>
  );
}

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

      {/* Scroll = the hour passing (17:00 → 19:00, desktop only) */}
      <HourMeter />

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 bg-background/90 backdrop-blur-md border-b border-transparent hover:border-rule transition-colors duration-300">
        <div className="flex items-center justify-between gap-3 py-5">
          <img src="/brand/logo-light.svg" alt="Slanthour" className="h-7 sm:h-8 w-auto shrink-0" />
          <nav className="flex items-center gap-4 md:gap-8 whitespace-nowrap">
            <a
              href="#themes"
              className="hidden sm:block text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors"
            >
              Themes
            </a>
            <a
              href="#how-it-works"
              className="hidden sm:block text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors"
            >
              How it works
            </a>
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
        {/* Section links that don't fit the top row on small screens */}
        <nav className="sm:hidden flex items-center gap-6 pb-3 -mt-1">
          <a href="#themes" className="text-[10px] uppercase tracking-wide text-muted/80 hover:text-foreground transition-colors">
            Themes
          </a>
          <a href="#how-it-works" className="text-[10px] uppercase tracking-wide text-muted/80 hover:text-foreground transition-colors">
            How it works
          </a>
          <Link href="/demo" className="text-[10px] uppercase tracking-wide text-muted/80 hover:text-foreground transition-colors">
            Live demo
          </Link>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section
        id="hero"
        className="pt-32 pb-16 md:pt-40 md:pb-24 px-6 md:px-12 max-w-[1100px] mx-auto lg:grid lg:grid-cols-[1fr_420px] lg:gap-16 lg:items-center"
      >
        <div>
          <div className="rise-in" style={{ "--rise-delay": "0ms" } as React.CSSProperties}>
            <p className="section-label flex items-center gap-2.5 mb-5 md:mb-6">
              <span aria-hidden className="block w-4 h-px bg-accent -rotate-[18deg]" />
              Pages for photographs · for{" "}
              <span className="word-cycle text-foreground/70 normal-case italic font-heading text-[13px] tracking-normal">
                <span>
                  {[...CYCLE_WORDS, CYCLE_WORDS[0]].map((word, i) => (
                    <span key={i}>{word}</span>
                  ))}
                </span>
              </span>
            </p>
          </div>
          <h1 className="font-heading text-[clamp(38px,6vw,72px)] font-light leading-[0.98] tracking-tight text-foreground mb-6 md:mb-10 [text-wrap:balance]">
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
            className="font-copy text-base md:text-xl text-muted max-w-[520px] leading-relaxed mb-8 md:mb-12 rise-in"
            style={{ "--rise-delay": "340ms" } as React.CSSProperties}
          >
            Turn photographs, memories and visual projects into a beautifully designed page on
            the web: a designed object, not a feed.
          </p>
          <div
            className="flex flex-wrap items-center gap-6 rise-in"
            style={{ "--rise-delay": "460ms" } as React.CSSProperties}
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
            <a
              href="#themes"
              className="draw-link text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors"
            >
              See the themes
            </a>
          </div>

          {/* Mobile: one photograph above the fold */}
          <div className="lg:hidden mt-8 photo-in" style={{ "--rise-delay": "300ms" } as React.CSSProperties}>
            <div className="relative aspect-[3/2] border border-rule overflow-hidden">
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
            <p className="mt-2 text-[9px] uppercase tracking-wide text-muted/60 font-body">
              № 01 · 18:47 · the slanted hour
            </p>
          </div>
        </div>

        {/* Desktop: prints catching the hour's light */}
        <HourHero className="hidden lg:block" />
      </section>

      {/* ── The hour of themes: pinned scroll theatre ────────── */}
      <HourOfThemes />

      {/* ── Theme showcase ──────────────────────────────────── */}
      <section id="themes" className="border-t border-rule scroll-mt-24">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-28">
          <Reveal>
            <div className="text-center mb-10">
              <p className="section-label mb-4 flex items-center justify-center gap-2.5">
                <span aria-hidden className="block w-4 h-px bg-accent -rotate-[18deg]" />
                {themeCountWord} themes
                <span aria-hidden className="block w-4 h-px bg-accent -rotate-[18deg]" />
              </p>
              <h2 className="font-heading text-[clamp(30px,5vw,40px)] font-light italic leading-tight text-foreground [text-wrap:balance]">
                Now try them live. The real renderer, right here.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <ThemeShowcase />
          </Reveal>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-rule scroll-mt-24">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-28">
          <Reveal>
            <div className="flex items-center gap-5 mb-14">
              <SlantLabel>How it works</SlantLabel>
              <div className="flex-1 h-px bg-rule" />
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            <Reveal>
              <Step
                n="01"
                title="Upload photographs"
                text="Drag in a collection: a trip, a series, a person, a year. Photos are resized and presented properly, with location data stripped for privacy."
              />
            </Reveal>
            <Reveal delay={130}>
              <Step
                n="02"
                title="Arrange and design"
                text="Build the page from sections: heroes, grids, contact sheets, text, quotes. Pick a theme and tune it. Everything autosaves."
              />
            </Reveal>
            <Reveal delay={260}>
              <Step
                n="03"
                title="Publish and share"
                text="Your page lives at slanthour.com/you/page-name. Make it public, unlisted, or protect it with a password."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Prints in the light: parallax spread ─────────────── */}
      <PrintsInLight />

      {/* ── Use cases ───────────────────────────────────────── */}
      <section className="border-t border-rule">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-start">
          <Reveal>
            <SlantLabel>Made for</SlantLabel>
            <h2 className="font-heading text-[clamp(30px,5vw,40px)] font-light italic leading-tight text-foreground mt-6 mb-5 [text-wrap:balance]">
              Anything worth keeping in one place.
            </h2>
            <p className="font-copy text-[17px] text-muted leading-loose">
              Slanthour is not a social network, a website builder or a backup drive. It does one
              thing: it turns a collection of photographs into a page that feels deliberately
              designed, like a book printed for the web.
            </p>
          </Reveal>
          <Reveal delay={140}>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 md:mt-2">
              {USE_CASES.map((useCase) => (
                <li
                  key={useCase}
                  className="border-t border-rule py-4 font-copy text-[15px] text-muted first:sm:border-t sm:[&:nth-child(2)]:border-t-0 first:border-t-0"
                >
                  {useCase}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── Publishing & pricing ────────────────────────────── */}
      <section className="border-t border-rule">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-start">
          <Reveal>
            <SlantLabel>Publishing</SlantLabel>
            <h2 className="font-heading text-[clamp(30px,5vw,40px)] font-light italic leading-tight text-foreground mt-6 mb-4 [text-wrap:balance]">
              Design freely. Publish when it&apos;s ready.
            </h2>
            <p className="font-copy text-[17px] text-muted leading-loose">
              The editor is always free: build and preview as many drafts as you like. A free
              account publishes three pages, each carrying one quiet &ldquo;Made with
              Slanthour&rdquo; line. Hobby removes the line for a small yearly fee; Pro adds
              high-fidelity images and private view counts. And for a page that should outlive any subscription, a Keepsake page
              is a single payment, kept published for at least ten years.
            </p>
          </Reveal>
          <Reveal delay={140}>
            <ul className="border-t border-rule mb-8">
              <PriceRow name="Free" price="$0" note="3 pages · all themes · quiet badge" />
              <PriceRow name="Hobby" price="$36/yr" note="10 pages · no badge · for the love of it" />
              <PriceRow
                name="Pro"
                price="$7/mo"
                note="25 pages · high-fidelity images · view counts · no badge"
              />
              <PriceRow
                name="Keepsake page"
                price="$39 once"
                note="one page · ten years in writing · archive download"
              />
            </ul>
            <div className="flex flex-col items-start gap-5">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-3 px-8 py-4 text-[10px] uppercase tracking-wide text-background bg-foreground hover:bg-accent transition-all duration-200 hover:-translate-y-px"
              >
                Create your first page{" "}
                <span className="text-sm transition-transform duration-200 group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </Link>
              <p className="font-copy text-sm text-muted/60">
                Free to start &middot; No credit card required &middot;{" "}
                <Link href="/pricing" className="underline underline-offset-2 hover:text-muted transition-colors">
                  Full pricing
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Questions ───────────────────────────────────────── */}
      <section className="border-t border-rule">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-28">
          <Reveal>
            <div className="flex items-center gap-5 mb-14">
              <SlantLabel>Questions</SlantLabel>
              <div className="flex-1 h-px bg-rule" />
            </div>
          </Reveal>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            {FAQS.map((faq, i) => (
              <Reveal key={faq.q} delay={(i % 2) * 120}>
                <dt className="font-heading text-xl font-light italic text-foreground mb-2">
                  {faq.q}
                </dt>
                <dd className="font-copy text-[15px] text-muted leading-relaxed">{faq.a}</dd>
              </Reveal>
            ))}
          </dl>
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

/* ── Small components ─────────────────────────────────────── */

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div>
      <span className="font-heading text-5xl font-light italic text-accent block mb-4">{n}</span>
      <h3 className="font-heading text-2xl font-light italic text-foreground mb-3">{title}</h3>
      <p className="font-copy text-base text-muted leading-relaxed">{text}</p>
    </div>
  );
}

function PriceRow({ name, price, note }: { name: string; price: string; note: string }) {
  return (
    <li className="border-b border-rule py-4 flex items-baseline justify-between gap-6">
      <div>
        <span className="font-heading text-lg font-light italic text-foreground">{name}</span>
        <span className="block text-[11px] font-copy text-muted mt-0.5">{note}</span>
      </div>
      <span className="font-heading text-lg font-light text-foreground whitespace-nowrap">
        {price}
      </span>
    </li>
  );
}
