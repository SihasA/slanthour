"use client";

// ─── Password gate ───────────────────────────────────────────────────
// Shown instead of a protected page until the visitor unlocks it.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unlockPage } from "@/lib/actions/gate";

export function PasswordGate({ pageId }: { pageId: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await unlockPage(pageId, password);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error ?? "That password isn't right.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background text-foreground">
      <div className="w-full max-w-xs text-center">
        <p className="text-[10px] uppercase tracking-label text-accent mb-3">Private page</p>
        <h1 className="font-heading text-2xl font-light italic mb-8">
          This page is password protected.
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="page-password" className="sr-only">
            Page password
          </label>
          <input
            id="page-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoFocus
            autoComplete="off"
            className="w-full bg-transparent border border-rule rounded-none px-4 py-3 text-center font-heading text-[15px] italic text-foreground placeholder:text-muted/40 focus:border-accent transition-colors focus:outline-none"
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
            {busy ? "…" : "View page"}
          </button>
        </form>
      </div>
    </div>
  );
}
