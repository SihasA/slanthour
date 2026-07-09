"use client";

// ─── New proofing gallery form ───────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProofingGallery } from "@/lib/actions/proofing";

export function CreateGalleryForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await createProofingGallery(title);
    if (result.ok) {
      router.push(`/proofing/${result.galleryId}`);
    } else {
      setError(result.error);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 sm:items-start">
      <div className="flex-1">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Gallery name, e.g. Perera wedding · selects"
          maxLength={120}
          className="w-full bg-transparent border border-rule px-4 py-3 text-sm font-copy focus:outline-none focus:border-accent transition-colors"
        />
        {error && <p className="mt-2 text-xs font-copy text-red-400">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={busy || title.trim().length === 0}
        className="shrink-0 px-5 py-3 text-[10px] uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-50"
      >
        {busy ? "Creating" : "+ New gallery"}
      </button>
    </form>
  );
}
