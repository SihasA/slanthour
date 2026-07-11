import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing · Slanthour",
  description:
    "Free to start. Hobby from $36 a year, Pro from $7 a month, Studio for client work. Keepsake pages: one payment, ten years in writing.",
};

// Billing is not open yet (see MONETIZATION_PLAN.md §2) — the tiers are
// announced honestly as "coming soon" and everything remains free until
// checkout exists. Features that don't exist yet are marked "Coming".
// Keep this page and lib/entitlements.ts in agreement.

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    lines: [
      "3 pages, 40 photographs each",
      "Every theme, every setting",
      "Public, unlisted and password-protected publishing",
      "A quiet “Made with Slanthour” line on published pages",
    ],
  },
  {
    name: "Hobby",
    price: "$36",
    period: "per year · works out to $3 a month",
    lines: [
      "10 pages, 100 photographs each",
      "No Slanthour line on your pages",
      "For photographers who shoot for the love of it",
    ],
  },
  {
    name: "Pro",
    price: "$7",
    period: "per month · $60 a year",
    lines: [
      "25 pages, 200 photographs each",
      "High-fidelity images (2560px) for large screens",
      "Page views, counted privately, without cookies or trackers",
      "3 proofing galleries: private links where clients pick their favourites",
    ],
  },
  {
    name: "Studio",
    price: "$18",
    period: "per month · $150 a year",
    lines: [
      "100 pages, 500 photographs each",
      "Everything in Pro",
      "For studios presenting and delivering to clients",
      "Unlimited proofing galleries",
      "Coming: high-fidelity client downloads",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <header className="px-6 md:px-12 py-6 flex items-center justify-between">
        <Link href="/">
          <img src="/brand/logo-light.svg" alt="Slanthour" className="h-7 w-auto" />
        </Link>
        <Link
          href="/login"
          className="text-[10px] uppercase tracking-wide text-accent hover:text-foreground transition-colors"
        >
          Log in
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <p className="section-label mb-5">Pricing</p>
        <h1 className="font-heading text-[clamp(36px,6vw,56px)] font-light leading-tight text-foreground mb-6 [text-wrap:balance]">
          Simple plans. One honest promise.
        </h1>
        <p className="font-copy text-[15px] text-muted leading-loose mb-12 max-w-xl">
          Billing hasn&apos;t opened yet, so everything below is free while we finish it. When it
          opens, nothing you&apos;ve already published comes down, and the editor is never locked
          behind a plan.
        </p>

        {/* ── Subscriptions ── */}
        <div className="border-t border-rule">
          {TIERS.map((tier) => (
            <section key={tier.name} className="border-b border-rule py-8 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 sm:gap-8">
              <div>
                <h2 className="font-heading text-2xl font-light italic mb-1">{tier.name}</h2>
                <p className="font-heading text-3xl font-light">{tier.price}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted mt-1">{tier.period}</p>
              </div>
              <ul className="space-y-2.5 font-copy text-[15px] text-muted sm:pt-1">
                {tier.lines.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-5 text-[10px] uppercase tracking-wide text-muted/70">
          Coming to every plan, free included: optional watermarking on your photographs
        </p>

        {/* ── Keepsake page ── */}
        <section className="mt-14 border border-rule p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4 mb-5">
            <h2 className="font-heading text-2xl font-light italic">Keepsake page</h2>
            <p className="font-heading text-3xl font-light">
              $39<span className="text-sm text-muted"> once</span>
            </p>
          </div>
          <p className="font-copy text-[15px] text-muted leading-loose mb-4">
            Some pages shouldn&apos;t depend on a subscription: a wedding, a tribute, a life. One
            payment keeps a single page published for as long as Slanthour exists, and at least
            ten years of that is written into the terms. We&apos;re a small studio, so we
            won&apos;t pretend forever is ours to promise. What we can promise: ten years
            minimum, a year&apos;s notice if we ever had to close, and a downloadable copy of
            your page that works on any web host, without us.
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted/70">
            Coming with billing · the ten-year term is written into the{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-accent transition-colors">
              terms
            </Link>
          </p>
        </section>

        <p className="font-copy text-[15px] text-muted leading-loose my-12">
          The principle won&apos;t change: explore and design before paying, keep what you&apos;ve
          published, take your photographs with you at any time. No artificial feature tiers, no
          locked editor.
        </p>

        <Link
          href="/signup"
          className="inline-flex items-center gap-3 px-8 py-4 text-[10px] uppercase tracking-wide text-background bg-foreground hover:bg-accent transition-colors duration-200"
        >
          Start free <span className="text-sm">&rarr;</span>
        </Link>
      </main>

      <footer className="border-t border-rule px-6 md:px-12 py-7 flex justify-between items-center">
        <Link href="/" className="text-[9px] uppercase tracking-wide text-muted/60 hover:text-muted transition-colors">
          ← slanthour.com
        </Link>
        <span className="text-[9px] tracking-wide text-muted/50">&copy; 2026 Slanthour</span>
      </footer>
    </div>
  );
}
