"use client";

// ─── Gallery password gate (anonymous client) ────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unlockGallery } from "@/lib/actions/proofing";

interface ProofGateProps {
  slug: string;
  title: string;
  photographer: string;
}

export function ProofGate({ slug, title, photographer }: ProofGateProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await unlockGallery(slug, password);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error);
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-[10px] uppercase tracking-wide text-muted mb-3">{photographer}</p>
        <h1 className="font-heading text-2xl italic font-light mb-2">{title}</h1>
        <p className="font-copy text-sm text-muted mb-8">
          This gallery is private. Enter the password your photographer shared with you.
        </p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Gallery password"
            autoFocus
            className="w-full bg-transparent border border-rule px-4 py-3 text-sm font-copy focus:outline-none focus:border-accent transition-colors"
          />
          {error && <p className="text-xs font-copy text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy || password.length === 0}
            className="px-4 py-3 text-[10px] uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-50"
          >
            {busy ? "Checking" : "Open gallery"}
          </button>
        </form>
      </div>
    </main>
  );
}
