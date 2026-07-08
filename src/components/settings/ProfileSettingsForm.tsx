"use client";

// ─── Profile settings form ───────────────────────────────────────────

import { useRef, useState } from "react";
import { updateAvatar, updateProfile } from "@/lib/actions/profile";
import { uploadPhoto } from "@/lib/upload-client";
import { validateUsername } from "@/lib/validation";
import { storageUrl } from "@/lib/media";
import type { Profile } from "@/types";

const fieldLabel = "text-[9px] uppercase tracking-label text-accent block mb-2";
const textInput =
  "w-full bg-transparent border border-rule rounded-none px-4 py-3 text-[14px] text-foreground placeholder:text-muted/40 focus:border-accent transition-colors focus:outline-none font-copy";

export function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarPath, setAvatarPath] = useState(profile.avatar_url);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const usernameCheck =
    username === profile.username ? { ok: true as const } : validateUsername(username);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const result = await updateProfile({ display_name: displayName, username, bio });
    setBusy(false);
    setStatus(
      result.ok
        ? { kind: "ok", text: "Profile saved." }
        : { kind: "error", text: result.error }
    );
  }

  async function handleAvatar(file: File) {
    setAvatarBusy(true);
    setStatus(null);
    const uploaded = await uploadPhoto(file);
    if (!uploaded.ok || !uploaded.asset) {
      setStatus({ kind: "error", text: uploaded.error ?? "Upload failed." });
      setAvatarBusy(false);
      return;
    }
    // The small square variant is ideal for an avatar.
    const smallPath = uploaded.asset.storage_path.replace(/lg\.jpg$/, "sm.jpg");
    const result = await updateAvatar(smallPath);
    if (result.ok) {
      setAvatarPath(smallPath);
      setStatus({ kind: "ok", text: "Profile photo updated." });
    } else {
      setStatus({ kind: "error", text: result.error });
    }
    setAvatarBusy(false);
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-7">
      {/* Avatar */}
      <div>
        <span className={fieldLabel}>Profile photo</span>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-surface border border-rule shrink-0">
            {avatarPath && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={storageUrl(avatarPath)} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
              className="px-4 py-2 text-[10px] uppercase tracking-wide border border-rule hover:border-accent text-foreground transition-colors disabled:opacity-40"
            >
              {avatarBusy ? "Uploading…" : avatarPath ? "Replace" : "Upload"}
            </button>
            {avatarPath && (
              <button
                type="button"
                onClick={async () => {
                  const result = await updateAvatar(null);
                  if (result.ok) setAvatarPath(null);
                }}
                className="px-4 py-2 text-[10px] uppercase tracking-wide text-muted hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Upload profile photo"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleAvatar(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="display-name" className={fieldLabel}>
          Display name
        </label>
        <input
          id="display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          maxLength={60}
          className={textInput}
        />
      </div>

      <div>
        <label htmlFor="username" className={fieldLabel}>
          Username
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-muted font-copy shrink-0">slanthour.com/</span>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className={textInput}
          />
        </div>
        {!usernameCheck.ok && (
          <p className="mt-1.5 text-[11px] text-red-400 font-copy">{usernameCheck.error}</p>
        )}
        {username !== profile.username && usernameCheck.ok && (
          <p className="mt-1.5 text-[11px] text-muted font-copy">
            Changing your username changes every page address; old links stop working.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className={fieldLabel}>
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder="A line or two about you or your work (optional)"
          className={`${textInput} resize-y`}
        />
      </div>

      {status && (
        <p
          className={`text-[13px] font-copy ${status.kind === "ok" ? "text-accent" : "text-red-400"}`}
          role={status.kind === "error" ? "alert" : "status"}
        >
          {status.text}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !usernameCheck.ok}
        className="self-start px-6 py-3 text-[10px] uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors disabled:opacity-40"
      >
        {busy ? "…" : "Save profile"}
      </button>
    </form>
  );
}
