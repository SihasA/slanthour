"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-16 flex justify-center">
          <img src="/brand/login-logo.svg" alt="Slanthour" className="h-20 w-auto" />
        </Link>

        <h1 className="font-heading text-3xl font-light italic text-foreground mb-2 text-center">
          Reset your password.
        </h1>
        <p className="font-copy text-sm text-muted text-center mb-10">
          We&apos;ll email you a link to choose a new one.
        </p>

        {sent ? (
          <p className="text-[13px] font-heading italic text-accent text-center" role="status">
            Check your email for the reset link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="email"
                className="text-[9px] uppercase tracking-label text-accent block mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
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
              {loading ? "…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="font-copy text-sm text-muted/60 text-center mt-8">
          <Link
            href="/login"
            className="text-accent hover:text-foreground transition-colors underline underline-offset-2"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
