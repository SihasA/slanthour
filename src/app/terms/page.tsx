import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms — Slanthour" };

const sectionTitle = "font-heading text-xl font-light italic text-foreground mt-10 mb-3";
const body = "font-copy text-[15px] text-muted leading-loose";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <header className="px-6 md:px-12 py-6">
        <Link href="/">
          <img src="/brand/logo-light.svg" alt="Slanthour" className="h-7 w-auto" />
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 md:py-16">
        <h1 className="font-heading text-4xl font-light italic mb-2">Terms of service</h1>
        <p className="text-[11px] uppercase tracking-label text-muted mb-8">
          Last updated 6 July 2026
        </p>

        <h2 className={sectionTitle}>The service</h2>
        <p className={body}>
          Slanthour lets you turn collections of photographs into designed, shareable web pages.
          The service is provided as-is while in early access; we work to keep it reliable but
          don&apos;t yet offer uptime guarantees.
        </p>

        <h2 className={sectionTitle}>Your content</h2>
        <p className={body}>
          You keep all rights to the photographs and text you upload. You grant us only the
          licence needed to store, resize and serve them as pages you configure. You are
          responsible for having the rights to what you publish.
        </p>

        <h2 className={sectionTitle}>Acceptable use</h2>
        <p className={body}>
          Don&apos;t use Slanthour to publish unlawful content, content that infringes others&apos;
          rights, or content depicting or exploiting minors. Don&apos;t attempt to disrupt the
          service or access other people&apos;s accounts, drafts or protected pages. We may remove
          content or suspend accounts that break these rules.
        </p>

        <h2 className={sectionTitle}>Publishing and availability</h2>
        <p className={body}>
          Published pages remain publicly available until you unpublish or delete them, or your
          account is removed. Draft content is private to your account.
        </p>

        <h2 className={sectionTitle}>Termination</h2>
        <p className={body}>
          You can delete your account at any time in Settings → Account, which removes your data
          as described in the privacy policy.
        </p>

        <h2 className={sectionTitle}>Contact</h2>
        <p className={body}>Questions about these terms: hello@slanthour.com.</p>
      </main>

      <footer className="border-t border-rule px-6 md:px-12 py-7 flex justify-between items-center">
        <Link href="/" className="text-[9px] uppercase tracking-wide text-muted/60 hover:text-muted transition-colors">
          ← slanthour.com
        </Link>
        <Link href="/privacy" className="text-[9px] uppercase tracking-wide text-muted/60 hover:text-muted transition-colors">
          Privacy
        </Link>
      </footer>
    </div>
  );
}
