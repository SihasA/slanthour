import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-12 bg-background/90 backdrop-blur-md border-b border-transparent hover:border-rule transition-colors duration-300">
        <img src="/brand/logo-light.svg" alt="Slant Hour" className="h-8 w-auto" />
        <nav className="flex items-center gap-6 md:gap-8">
          <a
            href="#how-it-works"
            className="text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors"
          >
            How it works
          </a>
          <a
            href="#get-started"
            className="text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors"
          >
            Get started
          </a>
          <Link
            href="/login"
            className="text-[10px] uppercase tracking-wide text-accent hover:text-foreground transition-colors"
          >
            Log in
          </Link>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="pt-40 pb-24 md:pt-52 md:pb-32 px-6 md:px-12 max-w-[1100px] mx-auto">
        <p className="section-label mb-5">
          Photography &middot; Film &middot; Design
        </p>
        <h1 className="font-heading text-[clamp(48px,8vw,88px)] font-light leading-[0.92] tracking-tight text-foreground mb-10">
          A home for your
          <br />
          <em className="text-muted">best work.</em>
        </h1>
        <p className="font-heading text-lg md:text-xl italic text-muted max-w-[480px] leading-relaxed mb-12">
          Slant Hour is a curated portfolio platform for photographers and
          visual creatives. Your top form, presented beautifully — not buried in
          a feed.
        </p>
        <div className="w-px h-12 bg-accent/50" />
      </section>

      {/* ── How It Works ────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-rule">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-28">
          <div className="flex items-center gap-5 mb-14">
            <span className="section-label whitespace-nowrap">
              How it works
            </span>
            <div className="flex-1 h-px bg-rule" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            {/* Step 1 */}
            <div>
              <span className="font-heading text-5xl font-light italic text-rule block mb-4">
                01
              </span>
              <h3 className="font-heading text-2xl font-light italic text-foreground mb-3">
                Sign up
              </h3>
              <p className="font-heading text-[15px] italic text-muted leading-relaxed">
                Create your free account in seconds. Sign up with Google or
                email — no invite needed.
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <span className="font-heading text-5xl font-light italic text-rule block mb-4">
                02
              </span>
              <h3 className="font-heading text-2xl font-light italic text-foreground mb-3">
                Upload your work
              </h3>
              <p className="font-heading text-[15px] italic text-muted leading-relaxed">
                Drag, drop, arrange. Choose your theme, set your banner, write
                your bio. Your portfolio is ready in minutes.
              </p>
            </div>

            {/* Step 3 */}
            <div>
              <span className="font-heading text-5xl font-light italic text-rule block mb-4">
                03
              </span>
              <h3 className="font-heading text-2xl font-light italic text-foreground mb-3">
                Share your link
              </h3>
              <p className="font-heading text-[15px] italic text-muted leading-relaxed">
                Your portfolio lives at slanthour.com/your-name — a clean,
                permanent link that shows only your best photographs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What You Get ────────────────────────────────────── */}
      <section className="border-t border-rule">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-start">
          <div>
            <p className="section-label mb-6">What you get</p>
            <h2 className="font-heading text-[clamp(32px,5vw,40px)] font-light italic leading-tight text-foreground mb-5">
              Showcase your work, your way.
            </h2>
            <p className="font-heading text-[17px] text-muted leading-loose">
              Slant Hour is for photographers, filmmakers, and designers who
              want a home for their work without the noise of social media. Each
              portfolio is independent, personal, and built to feel like a book —
              not a feed.
            </p>
          </div>

          <div className="flex flex-col gap-6 md:mt-2">
            <Feature
              label="A dedicated page"
              text="Your own page at slanthour.com/your-name, designed around your work."
            />
            <Feature
              label="Editorial layout"
              text="Album-style grids, fullscreen lightbox, series labels — built to feel like a photo book."
            />
            <Feature
              label="Custom theme"
              text="Light or dark mode, curated font pairings, and your own accent colour."
            />
            <Feature
              label="No algorithm"
              text="Your work is the page. Nothing else competes for attention."
            />
          </div>
        </div>
      </section>

      {/* ── Get Started ──────────────────────────────────────── */}
      <section id="get-started" className="border-t border-rule">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-start">
          <div>
            <p className="section-label mb-6">Get started</p>
            <h2 className="font-heading text-[clamp(32px,5vw,40px)] font-light italic leading-tight text-foreground mb-4">
              Build your portfolio today.
            </h2>
            <p className="font-heading text-[17px] italic text-muted leading-loose">
              Sign up for free and have your portfolio live in minutes.
              No waitlist, no invite codes — just your best work, beautifully
              presented.
            </p>
          </div>

          <div className="flex flex-col items-start gap-6 md:mt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-3 px-8 py-4 text-[10px] uppercase tracking-wide text-background bg-foreground hover:bg-accent transition-colors duration-200"
            >
              Create your portfolio <span className="text-sm">&rarr;</span>
            </Link>
            <p className="font-heading text-[13px] italic text-muted/60">
              Free to use &middot; No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-rule px-6 md:px-12 py-7 flex flex-col md:flex-row justify-between items-center gap-3">
        <img src="/brand/logo-light.svg" alt="Slant Hour" className="h-6 w-auto opacity-50" />
        <span className="text-[9px] tracking-wide text-muted/50">
          &copy; 2026 &middot; All rights reserved
        </span>
      </footer>
    </div>
  );
}

/* ── Small components ─────────────────────────────────────── */

function Feature({ label, text }: { label: string; text: string }) {
  return (
    <div className="border-t border-rule pt-6 first:border-0 first:pt-0">
      <p className="text-[9px] uppercase tracking-label text-accent mb-2">
        {label}
      </p>
      <p className="font-heading text-[15px] italic text-muted leading-relaxed">
        {text}
      </p>
    </div>
  );
}
