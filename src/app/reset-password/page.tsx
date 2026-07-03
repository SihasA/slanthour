"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(
        error.message === "Auth session missing!"
          ? "This reset link has expired. Request a new one."
          : error.message
      );
    } else {
      setDone(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-16 flex justify-center">
          <img src="/brand/login-logo.svg" alt="Slanthour" className="h-20 w-auto" />
        </Link>

        <h1 className="font-heading text-3xl font-light italic text-foreground mb-2 text-center">
          Choose a new password.
        </h1>

        {done ? (
          <div className="text-center mt-8 space-y-6">
            <p className="text-[13px] font-heading italic text-accent" role="status">
              Password updated.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-8 py-3 text-[10px] uppercase tracking-wide text-background bg-foreground hover:bg-accent transition-colors duration-200"
            >
              Go to dashboard
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-10">
            <div>
              <label
                htmlFor="password"
                className="text-[9px] uppercase tracking-label text-accent block mb-2"
              >
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full bg-transparent border border-rule rounded-none px-4 py-3 font-heading text-[15px] italic text-foreground placeholder:text-muted/40 focus:border-accent transition-colors"
              />
            </div>

            {error && (
              <p className="text-[13px] font-heading italic text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 text-[10px] uppercase tracking-wide text-background bg-foreground hover:bg-accent transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none"
            >
              {loading ? "…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
