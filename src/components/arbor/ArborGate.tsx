"use client";

import { useState } from "react";

export default function ArborGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/arbor/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl font-light italic text-foreground">
            Arbor
          </h1>
          <p className="text-[9px] uppercase tracking-label text-accent mt-3">
            AI Context Library
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="arbor-password"
              className="text-[9px] uppercase tracking-label text-accent block mb-2"
            >
              Password
            </label>
            <input
              id="arbor-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="w-full bg-transparent border border-rule rounded-none px-4 py-3 font-heading text-[15px] italic text-foreground placeholder:text-muted/40 focus:border-accent transition-colors"
            />
          </div>

          {error && (
            <p className="text-[13px] font-heading italic text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 text-[10px] uppercase tracking-wide text-background bg-foreground hover:bg-accent transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none"
          >
            {loading ? "..." : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
