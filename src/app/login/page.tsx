"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Middleware will handle redirect to /dashboard on next request
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link
          href="/"
          className="font-heading text-xl italic font-light tracking-tight text-foreground block mb-16 text-center"
        >
          Slant Hour
        </Link>

        {/* Title */}
        <h1 className="font-heading text-3xl font-light italic text-foreground mb-2 text-center">
          Welcome back.
        </h1>
        <p className="font-heading text-sm italic text-muted text-center mb-10">
          Log in to manage your portfolio.
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
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
              className="w-full bg-transparent border border-rule rounded-none px-4 py-3 font-heading text-[15px] italic text-foreground placeholder:text-muted/40 focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-[9px] uppercase tracking-label text-accent block mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              className="w-full bg-transparent border border-rule rounded-none px-4 py-3 font-heading text-[15px] italic text-foreground placeholder:text-muted/40 focus:border-accent transition-colors"
            />
          </div>

          {error && (
            <p className="text-[13px] font-heading italic text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 text-[10px] uppercase tracking-wide text-background bg-foreground hover:bg-accent transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Note */}
        <p className="font-heading text-[13px] italic text-muted/60 text-center mt-10">
          Slant Hour is invite-only. If you&apos;ve been invited, check your
          email for login details.
        </p>
      </div>
    </div>
  );
}
