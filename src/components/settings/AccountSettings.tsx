"use client";

// ─── Account settings ────────────────────────────────────────────────
// Email display, password change (email-auth accounts), account deletion.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteAccount } from "@/lib/actions/account";

const fieldLabel = "text-[9px] uppercase tracking-label text-accent block mb-2";
const textInput =
  "w-full bg-transparent border border-rule rounded-none px-4 py-3 text-[14px] text-foreground placeholder:text-muted/40 focus:border-accent transition-colors focus:outline-none font-copy";

export function AccountSettings({
  email,
  hasPasswordAuth,
}: {
  email: string;
  hasPasswordAuth: boolean;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [confirmText, setConfirmText] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordBusy(true);
    setPasswordStatus(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordBusy(false);
    if (error) setPasswordStatus({ kind: "error", text: error.message });
    else {
      setPasswordStatus({ kind: "ok", text: "Password updated." });
      setNewPassword("");
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setDeleteBusy(true);
    setDeleteStatus(null);
    const result = await deleteAccount(confirmText);
    if (result.ok) {
      window.location.href = "/";
    } else {
      setDeleteStatus(result.error);
      setDeleteBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <div>
        <span className={fieldLabel}>Email</span>
        <p className="font-copy text-[14px] text-foreground">{email}</p>
        {!hasPasswordAuth && (
          <p className="mt-1 text-[11px] text-muted font-copy">You sign in with Google.</p>
        )}
      </div>

      {hasPasswordAuth && (
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          <div>
            <label htmlFor="new-password" className={fieldLabel}>
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
              placeholder="At least 6 characters"
              className={textInput}
            />
          </div>
          {passwordStatus && (
            <p
              className={`text-[13px] font-copy ${passwordStatus.kind === "ok" ? "text-accent" : "text-red-400"}`}
              role={passwordStatus.kind === "error" ? "alert" : "status"}
            >
              {passwordStatus.text}
            </p>
          )}
          <button
            type="submit"
            disabled={passwordBusy}
            className="self-start px-6 py-3 text-[10px] uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-40"
          >
            {passwordBusy ? "…" : "Change password"}
          </button>
        </form>
      )}

      {/* Danger zone */}
      <div className="border-t border-rule pt-8">
        <h2 className="text-[10px] uppercase tracking-wide text-red-400 mb-3">Delete account</h2>
        <p className="font-copy text-[13px] text-muted mb-4 max-w-md">
          Deletes your account, every page (published and draft) and every uploaded photograph.
          This cannot be undone.
        </p>
        {deleteOpen ? (
          <form onSubmit={handleDelete} className="flex flex-col gap-3 max-w-md">
            <label htmlFor="delete-confirm" className="text-[11px] font-copy text-muted">
              Type <span className="text-foreground">delete my account</span> to confirm.
            </label>
            <input
              id="delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              className={textInput}
            />
            {deleteStatus && (
              <p className="text-[13px] font-copy text-red-400" role="alert">
                {deleteStatus}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={deleteBusy || confirmText !== "delete my account"}
                className="px-5 py-2.5 text-[10px] uppercase tracking-wide bg-red-500/80 text-white hover:bg-red-500 transition-colors disabled:opacity-40"
              >
                {deleteBusy ? "Deleting…" : "Delete everything"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="px-5 py-2.5 text-[10px] uppercase tracking-wide border border-rule text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setDeleteOpen(true)}
            className="px-5 py-2.5 text-[10px] uppercase tracking-wide border border-rule text-muted hover:text-red-400 hover:border-red-400/50 transition-colors"
          >
            Delete my account…
          </button>
        )}
      </div>
    </div>
  );
}
