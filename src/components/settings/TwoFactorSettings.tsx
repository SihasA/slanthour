"use client";

// ─── Two-factor authentication (TOTP) ───────────────────────────────────
// Opt-in second factor via Supabase native MFA. All calls here are Auth-SDK
// calls (not DB writes), so they correctly run client-side, mirroring the
// password-change flow in AccountSettings.

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Phase = "loading" | "off" | "enrolling" | "on";

interface EnrollData {
  factorId: string;
  qrCode: string;
  secret: string;
}

export function TwoFactorSettings() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);
  const [enroll, setEnroll] = useState<EnrollData | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  const supabase = createClient();

  const refresh = useCallback(async () => {
    setError("");
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setError(error.message);
      setPhase("off");
      return;
    }
    const verified = data.totp[0];
    if (verified) {
      setVerifiedFactorId(verified.id);
      setPhase("on");
    } else {
      setVerifiedFactorId(null);
      setPhase("off");
    }
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleEnable() {
    setBusy(true);
    setError("");
    setCode("");

    // Clear dangling unverified factors first, since repeated Enable attempts
    // otherwise pile up junk factors and Supabase rejects duplicates.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    if (existing) {
      // listFactors().totp holds only verified factors, so scan .all for the
      // unverified totp leftovers a prior aborted Enable may have created.
      for (const f of existing.all) {
        if (f.factor_type === "totp" && f.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (error || !data) {
      setError(error?.message ?? "Could not start two-factor setup. Please try again.");
      return;
    }
    setEnroll({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
    setPhase("enrolling");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!enroll) return;
    setBusy(true);
    setError("");

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: enroll.factorId,
    });
    if (challengeError || !challenge) {
      setError(challengeError?.message ?? "Could not start the challenge. Please try again.");
      setBusy(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: enroll.factorId,
      challengeId: challenge.id,
      code,
    });
    setBusy(false);
    if (verifyError) {
      setError("That code didn't match. Check your authenticator and try again.");
      setCode("");
      return;
    }
    setEnroll(null);
    setCode("");
    await refresh();
  }

  async function handleCancelEnroll() {
    if (enroll) {
      await supabase.auth.mfa.unenroll({ factorId: enroll.factorId });
    }
    setEnroll(null);
    setCode("");
    setError("");
    setPhase("off");
  }

  async function handleRemove() {
    if (!verifiedFactorId) return;
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactorId });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setConfirmRemove(false);
    await refresh();
  }

  return (
    <section className="border border-rule p-6 mb-10">
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <h2 className="text-[10px] uppercase tracking-wide text-muted">
          Two-factor authentication
        </h2>
        <span className="font-heading italic text-xl font-light">
          {phase === "on" ? "On" : phase === "loading" ? "…" : "Off"}
        </span>
      </div>

      {error && (
        <p className="mb-4 text-[13px] font-copy text-red-400" role="alert">
          {error}
        </p>
      )}

      {phase === "loading" && (
        <p className="font-copy text-[13px] text-muted leading-relaxed">Checking status…</p>
      )}

      {phase === "off" && (
        <div className="flex flex-col gap-4">
          <p className="font-copy text-[13px] text-muted leading-relaxed">
            Add a second step at sign-in using an authenticator app. You&apos;ll enter a 6-digit
            code along with your password.
          </p>
          <p className="font-copy text-[12px] text-muted/70 leading-relaxed">
            Heads up · if you lose your authenticator you can be locked out. There are no backup
            codes yet, so keep a recovery method (a second device or a saved secret).
          </p>
          <button
            onClick={handleEnable}
            disabled={busy}
            className="self-start px-6 py-3 text-[10px] uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-40"
          >
            {busy ? "…" : "Enable"}
          </button>
        </div>
      )}

      {phase === "enrolling" && enroll && (
        <div className="flex flex-col gap-5">
          <p className="font-copy text-[13px] text-muted leading-relaxed">
            Scan this code with your authenticator app (Google Authenticator, 1Password, Authy, and
            so on), then enter the 6-digit code it shows.
          </p>

          {/* Supabase returns the QR as an SVG data URL, rendered directly. */}
          <div className="bg-white p-3 self-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={enroll.qrCode} alt="Two-factor QR code" className="w-40 h-40 block" />
          </div>

          <div>
            <span className="text-[9px] uppercase tracking-label text-accent block mb-2">
              Or enter this key manually
            </span>
            <code className="font-copy text-[13px] text-foreground break-all select-all">
              {enroll.secret}
            </code>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="totp-code"
                className="text-[9px] uppercase tracking-label text-accent block mb-2"
              >
                6-digit code
              </label>
              <input
                id="totp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                required
                className="w-full max-w-[200px] bg-transparent border border-rule rounded-none px-4 py-3 text-[14px] tracking-[0.3em] text-center text-foreground placeholder:text-muted/40 focus:border-accent transition-colors focus:outline-none font-copy"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className="px-6 py-3 text-[10px] uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-40"
              >
                {busy ? "…" : "Verify and turn on"}
              </button>
              <button
                type="button"
                onClick={handleCancelEnroll}
                className="px-5 py-3 text-[10px] uppercase tracking-wide border border-rule text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {phase === "on" && (
        <div className="flex flex-col gap-4">
          <p className="font-copy text-[13px] text-muted leading-relaxed">
            Two-factor is on. You&apos;ll be asked for a code from your authenticator app each time
            you sign in.
          </p>
          {confirmRemove ? (
            <div className="flex flex-col gap-3">
              <p className="font-copy text-[13px] text-muted leading-relaxed">
                Removing two-factor weakens your account. Are you sure?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRemove}
                  disabled={busy}
                  className="px-5 py-2.5 text-[10px] uppercase tracking-wide bg-red-500/80 text-white hover:bg-red-500 transition-colors disabled:opacity-40"
                >
                  {busy ? "…" : "Remove two-factor"}
                </button>
                <button
                  onClick={() => setConfirmRemove(false)}
                  className="px-5 py-2.5 text-[10px] uppercase tracking-wide border border-rule text-muted hover:text-foreground transition-colors"
                >
                  Keep it on
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRemove(true)}
              className="self-start px-5 py-2.5 text-[10px] uppercase tracking-wide border border-rule text-muted hover:text-red-400 hover:border-red-400/50 transition-colors"
            >
              Remove two-factor…
            </button>
          )}
        </div>
      )}
    </section>
  );
}
