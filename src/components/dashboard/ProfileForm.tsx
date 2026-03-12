"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RESERVED_SLUGS } from "@/lib/constants";
import type { Profile } from "@/types";

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [form, setForm] = useState({
    display_name: profile.display_name,
    username: profile.username,
    bio: profile.bio ?? "",
    email_public: profile.email_public ?? "",
    instagram_handle: profile.instagram_handle ?? "",
    website_url: profile.website_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setStatus("idle");
  }

  function validateUsername(username: string): string | null {
    if (username.length < 3) return "Username must be at least 3 characters.";
    if (!/^[a-z0-9-]+$/.test(username))
      return "Lowercase letters, numbers, and hyphens only.";
    if (RESERVED_SLUGS.includes(username as (typeof RESERVED_SLUGS)[number]))
      return "This username is reserved.";
    return null;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const usernameError = validateUsername(form.username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name.trim(),
        username: form.username.trim().toLowerCase(),
        bio: form.bio.trim() || null,
        email_public: form.email_public.trim() || null,
        instagram_handle: form.instagram_handle.replace(/^@/, "").trim() || null,
        website_url: form.website_url.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    setSaving(false);

    if (updateError) {
      if (updateError.code === "23505") {
        setError("This username is already taken.");
      } else {
        setError("Failed to save. Please try again.");
      }
      setStatus("error");
    } else {
      setStatus("saved");
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <Field
        label="Display name"
        value={form.display_name}
        onChange={(v) => update("display_name", v)}
        required
      />

      <div>
        <Field
          label="Username"
          value={form.username}
          onChange={(v) => update("username", v.toLowerCase())}
          required
        />
        <p className="text-[11px] text-muted mt-1.5">
          slanthour.com/{form.username || "..."}
        </p>
      </div>

      <div>
        <label className="text-[9px] uppercase tracking-label text-accent block mb-2">
          Bio
        </label>
        <textarea
          value={form.bio}
          onChange={(e) => update("bio", e.target.value)}
          rows={3}
          placeholder="A few words about your work..."
          className="w-full bg-transparent border border-rule rounded-none px-4 py-3 font-heading text-[15px] italic text-foreground placeholder:text-muted/40 resize-none focus:border-accent transition-colors"
        />
      </div>

      <Field
        label="Public email"
        type="email"
        value={form.email_public}
        onChange={(v) => update("email_public", v)}
        placeholder="Optional — shown on your portfolio"
      />

      <Field
        label="Instagram"
        value={form.instagram_handle}
        onChange={(v) => update("instagram_handle", v)}
        placeholder="@handle"
      />

      <Field
        label="Website"
        type="url"
        value={form.website_url}
        onChange={(v) => update("website_url", v)}
        placeholder="https://..."
      />

      {error && (
        <p className="text-[13px] font-heading italic text-red-400">{error}</p>
      )}

      <div className="flex items-center gap-4 mt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-3 text-[10px] uppercase tracking-wide text-foreground border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-all duration-200 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save profile"}
          <span className="text-sm">&rarr;</span>
        </button>

        {status === "saved" && (
          <span className="text-[11px] font-heading italic text-accent">
            Saved
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-[9px] uppercase tracking-label text-accent block mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-transparent border border-rule rounded-none px-4 py-3 font-heading text-[15px] italic text-foreground placeholder:text-muted/40 focus:border-accent transition-colors"
      />
    </div>
  );
}
