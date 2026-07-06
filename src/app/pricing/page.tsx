import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Slanthour",
  description: "Slanthour is free while in its early days.",
};

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

      <main className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        <p className="section-label mb-5">Pricing</p>
        <h1 className="font-heading text-[clamp(36px,6vw,56px)] font-light leading-tight text-foreground mb-8 [text-wrap:balance]">
          Free while Slanthour is young.
        </h1>

        <div className="border border-rule p-8 mb-10">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-heading text-2xl font-light italic">Early access</h2>
            <p className="font-heading text-3xl font-light">
              £0<span className="text-sm text-muted"> / month</span>
            </p>
          </div>
          <ul className="space-y-3 font-copy text-[15px] text-muted">
            <li>· Up to 5 pages, 60 photographs each</li>
            <li>· All five themes</li>
            <li>· Public, unlisted and password-protected publishing</li>
            <li>· Your pages at slanthour.com/your-name</li>
          </ul>
        </div>

        <p className="font-copy text-[15px] text-muted leading-loose mb-10">
          A paid plan with higher limits will come later. The principle won&apos;t change: you can
          always explore and design before paying, and pages you have already published stay up.
          There are no artificial feature tiers and no locked editor.
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
