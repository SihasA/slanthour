"use client";

// ─── Start from an example ───────────────────────────────────────────
// Lets a brand-new user skip the blank page entirely: one click clones
// the finished showcase page into their account and drops them straight
// into the editor so they feel the product before uploading anything.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startFromExample } from "@/lib/actions/pages";

export function StartFromExample({ primary = true }: { primary?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setBusy(true);
    setError("");
    const result = await startFromExample();
    if (result.ok) {
      router.push(`/editor/${result.pageId}`);
    } else {
      setError(result.error);
      setBusy(false);
    }
  }

  const className = primary
    ? "inline-block px-6 py-3 text-[10px] uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-40"
    : "text-[10px] uppercase tracking-wide text-muted underline underline-offset-2 hover:text-accent transition-colors disabled:opacity-40";

  // The non-primary variant is meant to sit inline inside a paragraph of
  // text, so it renders only phrasing content (a button and, on error, a
  // span) rather than a block wrapper.
  if (!primary) {
    return (
      <>
        <button type="button" onClick={handleClick} disabled={busy} className={className}>
          {busy ? "…" : "Start from an example"}
        </button>
        {error && (
          <span className="ml-2 font-heading italic text-red-400" role="alert">
            {error}
          </span>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <button type="button" onClick={handleClick} disabled={busy} className={className}>
        {busy ? "…" : "Start from an example"}
      </button>
      {error && (
        <p className="mt-2 text-[13px] font-heading italic text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
