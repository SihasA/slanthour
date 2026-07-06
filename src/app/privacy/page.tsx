import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy — Slanthour" };

const sectionTitle = "font-heading text-xl font-light italic text-foreground mt-10 mb-3";
const body = "font-copy text-[15px] text-muted leading-loose";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <header className="px-6 md:px-12 py-6">
        <Link href="/">
          <img src="/brand/logo-light.svg" alt="Slanthour" className="h-7 w-auto" />
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 md:py-16">
        <h1 className="font-heading text-4xl font-light italic mb-2">Privacy</h1>
        <p className="text-[11px] uppercase tracking-label text-muted mb-8">
          Last updated 6 July 2026
        </p>

        <p className={body}>
          Slanthour exists to publish the pages you choose to publish — nothing more. This policy
          describes what we store and why, in plain language.
        </p>

        <h2 className={sectionTitle}>What we store</h2>
        <p className={body}>
          Your account (email address, display name, username, optional bio and profile photo),
          the pages you create, and the photographs you upload. Authentication is handled by
          Supabase; if you sign in with Google we receive your email address and name from Google.
        </p>

        <h2 className={sectionTitle}>Your photographs</h2>
        <p className={body}>
          Photographs are re-encoded on upload, which removes embedded camera metadata — including
          GPS location — before anything reaches our storage. We keep the display versions we
          generate, not your original camera files. Photographs on draft or restricted pages are
          not listed publicly, but are served from storage URLs that are unguessable rather than
          access-controlled — treat truly sensitive images accordingly.
        </p>

        <h2 className={sectionTitle}>Page passwords</h2>
        <p className={body}>
          Passwords you set on protected pages are stored as cryptographic hashes. We cannot read
          them, and we never log them.
        </p>

        <h2 className={sectionTitle}>What we don&apos;t do</h2>
        <p className={body}>
          We don&apos;t run advertising, sell data, track visitors across the web, or profile the
          people who view your pages.
        </p>

        <h2 className={sectionTitle}>Deleting your data</h2>
        <p className={body}>
          Deleting a page removes its draft and published versions. Deleting your account (in
          Settings → Account) removes your profile, every page and every uploaded photograph.
        </p>

        <h2 className={sectionTitle}>Contact</h2>
        <p className={body}>
          Questions about this policy: hello@slanthour.com.
        </p>
      </main>

      <footer className="border-t border-rule px-6 md:px-12 py-7 flex justify-between items-center">
        <Link href="/" className="text-[9px] uppercase tracking-wide text-muted/60 hover:text-muted transition-colors">
          ← slanthour.com
        </Link>
        <Link href="/terms" className="text-[9px] uppercase tracking-wide text-muted/60 hover:text-muted transition-colors">
          Terms
        </Link>
      </footer>
    </div>
  );
}
