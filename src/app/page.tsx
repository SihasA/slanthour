import Link from "next/link";
import { ThemeShowcase } from "@/components/landing/ThemeShowcase";

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

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-12 bg-background/90 backdrop-blur-md border-b border-transparent hover:border-rule transition-colors duration-300">
        <img src="/brand/logo-light.svg" alt="Slanthour" className="h-8 w-auto" />
        <nav className="flex items-center gap-6 md:gap-8">
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
            className="text-[10px] uppercase tracking-wide text-accent hover:text-foreground transition-colors"
          >
            Log in
          </Link>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="pt-40 pb-20 md:pt-52 md:pb-28 px-6 md:px-12 max-w-[1100px] mx-auto">
        <p className="section-label mb-5">Pages for photographs</p>
        <h1 className="font-heading text-[clamp(44px,8vw,88px)] font-light leading-[0.95] tracking-tight text-foreground mb-10 [text-wrap:balance]">
          A home for photos that deserve
          <em className="text-muted"> more than a post.</em>
        </h1>
        <p className="font-copy text-lg md:text-xl text-muted max-w-[520px] leading-relaxed mb-12">
          Turn photographs, memories and visual projects into a beautifully designed page on
          the web — a designed object, not a feed.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 px-8 py-4 text-[10px] uppercase tracking-wide text-background bg-foreground hover:bg-accent transition-colors duration-200"
          >
            Create a page <span className="text-sm">&rarr;</span>
          </Link>
          <a
            href="#themes"
            className="text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors underline underline-offset-4"
          >
            See the themes
          </a>
        </div>
      </section>

      {/* ── Five-theme showcase ─────────────────────────────── */}
      <section id="themes" className="border-t border-rule">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-28">
          <div className="text-center mb-10">
            <p className="section-label mb-4">Five themes</p>
            <h2 className="font-heading text-[clamp(30px,5vw,40px)] font-light italic leading-tight text-foreground [text-wrap:balance]">
              Same photographs. Five deliberate designs.
            </h2>
          </div>
          <ThemeShowcase />
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-rule">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-28">
          <div className="flex items-center gap-5 mb-14">
            <span className="section-label whitespace-nowrap">How it works</span>
            <div className="flex-1 h-px bg-rule" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            <Step
              n="01"
              title="Upload photographs"
              text="Drag in a collection — a trip, a series, a person, a year. Photos are resized and presented properly, with location data stripped for privacy."
            />
            <Step
              n="02"
              title="Arrange and design"
              text="Build the page from sections — heroes, grids, contact sheets, text, quotes. Pick one of five themes and tune it. Everything autosaves."
            />
            <Step
              n="03"
              title="Publish and share"
              text="Your page lives at slanthour.com/you/page-name. Make it public, unlisted, or protect it with a password."
            />
          </div>
        </div>
      </section>

      {/* ── Use cases ───────────────────────────────────────── */}
      <section className="border-t border-rule">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-start">
          <div>
            <p className="section-label mb-6">Made for</p>
            <h2 className="font-heading text-[clamp(30px,5vw,40px)] font-light italic leading-tight text-foreground mb-5 [text-wrap:balance]">
              Anything worth keeping in one place.
            </h2>
            <p className="font-copy text-[17px] text-muted leading-loose">
              Slanthour is not a social network, a website builder or a backup drive. It does one
              thing: it turns a collection of photographs into a page that feels deliberately
              designed — like a book, printed for the web.
            </p>
          </div>
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
        </div>
      </section>

      {/* ── Publishing / pricing note ───────────────────────── */}
      <section className="border-t border-rule">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-start">
          <div>
            <p className="section-label mb-6">Publishing</p>
            <h2 className="font-heading text-[clamp(30px,5vw,40px)] font-light italic leading-tight text-foreground mb-4 [text-wrap:balance]">
              Design freely. Publish when it&apos;s ready.
            </h2>
            <p className="font-copy text-[17px] text-muted leading-loose">
              The editor is free — build and preview as many drafts as you like. Publishing is
              free while Slanthour is in its early days. Public, unlisted and password-protected
              pages are all included.
            </p>
          </div>
          <div className="flex flex-col items-start gap-6 md:mt-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-3 px-8 py-4 text-[10px] uppercase tracking-wide text-background bg-foreground hover:bg-accent transition-colors duration-200"
            >
              Create your first page <span className="text-sm">&rarr;</span>
            </Link>
            <p className="font-copy text-sm text-muted/60">
              Free to use &middot; No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-rule px-6 md:px-12 py-7 flex flex-col md:flex-row justify-between items-center gap-3">
        <img src="/brand/logo-light.svg" alt="Slanthour" className="h-6 w-auto opacity-50" />
        <nav className="flex items-center gap-6">
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
