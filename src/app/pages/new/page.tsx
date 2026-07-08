"use client";

// ─── Create a new page ───────────────────────────────────────────────
// Minimal step: name the page, then straight into the editor.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPage } from "@/lib/actions/pages";

export default function NewPagePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await createPage(title);
    if (result.ok) {
      router.push(`/editor/${result.pageId}`);
    } else {
      setError(result.error);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/dashboard" className="block mb-12 text-[10px] uppercase tracking-wide text-muted hover:text-foreground transition-colors">
          ← Back to pages
        </Link>

        <h1 className="font-heading text-3xl font-light italic text-foreground mb-2">
          Name your page.
        </h1>
        <p className="font-copy text-sm text-muted mb-8">
          A photo series, a trip, a person, a project. You can rename it any time.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lisbon, November"
            autoFocus
            maxLength={120}
            aria-label="Page title"
            className="w-full bg-transparent border border-rule rounded-none px-4 py-3 font-heading text-[15px] italic text-foreground placeholder:text-muted/40 focus:border-accent transition-colors focus:outline-none"
          />

          {error && (
            <p className="text-[13px] font-heading italic text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 text-[10px] uppercase tracking-wide text-background bg-foreground hover:bg-accent transition-colors duration-200 disabled:opacity-40"
          >
            {busy ? "…" : "Create page"}
          </button>
        </form>
      </div>
    </div>
  );
}
