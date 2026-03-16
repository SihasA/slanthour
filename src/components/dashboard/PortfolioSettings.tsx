"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TITLE_MAX_LENGTH, SUBTITLE_MAX_LENGTH } from "@/lib/constants";
import type { Portfolio } from "@/types";

interface PortfolioSettingsProps {
  portfolio: Portfolio;
}

export function PortfolioSettings({ portfolio }: PortfolioSettingsProps) {
  const [title, setTitle] = useState(portfolio.title);
  const [subtitle, setSubtitle] = useState(portfolio.subtitle ?? "");
  const [isPublished, setIsPublished] = useState(portfolio.is_published);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [publishSaving, setPublishSaving] = useState(false);

  const titleOver = title.length > TITLE_MAX_LENGTH;
  const subtitleOver = subtitle.length > SUBTITLE_MAX_LENGTH;
  const canSave = !titleOver && !subtitleOver && title.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setStatus("Saving...");

    const supabase = createClient();
    const { error } = await supabase
      .from("portfolios")
      .update({
        title: title.trim() || "Untitled",
        subtitle: subtitle.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", portfolio.id);

    setSaving(false);
    setStatus(error ? "Failed to save" : "Saved");
    setTimeout(() => setStatus(null), 3000);
  }

  async function togglePublish() {
    setPublishSaving(true);
    const newState = !isPublished;

    const supabase = createClient();
    const { error } = await supabase
      .from("portfolios")
      .update({
        is_published: newState,
        updated_at: new Date().toISOString(),
      })
      .eq("id", portfolio.id);

    if (!error) {
      setIsPublished(newState);
    }
    setPublishSaving(false);
  }

  return (
    <div className="space-y-12">
      {/* Title & Subtitle */}
      <div className="space-y-5 max-w-lg">
        <div>
          <label className="text-[9px] uppercase tracking-label text-accent block mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX_LENGTH + 5}
            placeholder="Portfolio title"
            className={`w-full bg-transparent border px-4 py-3 font-heading italic text-[15px] text-foreground placeholder:text-muted/40 focus:outline-none transition-colors ${
              titleOver
                ? "border-red-400 focus:border-red-400"
                : "border-rule focus:border-accent"
            }`}
          />
          <p
            className={`text-[11px] mt-1.5 ${
              titleOver ? "text-red-400" : title.length > TITLE_MAX_LENGTH - 5 ? "text-accent" : "text-muted/50"
            }`}
          >
            {title.length}/{TITLE_MAX_LENGTH}
          </p>
        </div>

        <div>
          <label className="text-[9px] uppercase tracking-label text-accent block mb-2">
            Subtitle
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={SUBTITLE_MAX_LENGTH + 10}
            placeholder="A short description of your work"
            className={`w-full bg-transparent border px-4 py-3 font-heading italic text-[15px] text-foreground placeholder:text-muted/40 focus:outline-none transition-colors ${
              subtitleOver
                ? "border-red-400 focus:border-red-400"
                : "border-rule focus:border-accent"
            }`}
          />
          <p
            className={`text-[11px] mt-1.5 ${
              subtitleOver ? "text-red-400" : subtitle.length > SUBTITLE_MAX_LENGTH - 10 ? "text-accent" : "text-muted/50"
            }`}
          >
            {subtitle.length}/{SUBTITLE_MAX_LENGTH}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-wide text-foreground border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save details"}
            <span className="text-sm">&rarr;</span>
          </button>
          {status && !saving && (
            <span className="text-[10px] uppercase tracking-wide text-accent">
              {status}
            </span>
          )}
        </div>
      </div>

      {/* Publish toggle */}
      <div>
        <div className="flex items-center gap-5 mb-6">
          <span className="section-label whitespace-nowrap">Publish</span>
          <div className="flex-1 h-px bg-rule" />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span
              className={`w-2 h-2 rounded-full ${
                isPublished ? "bg-accent" : "bg-muted/40"
              }`}
            />
            <span className="text-[10px] uppercase tracking-wide text-foreground">
              {isPublished ? "Published" : "Draft"}
            </span>
          </div>

          <button
            onClick={togglePublish}
            disabled={publishSaving}
            className={`text-[10px] uppercase tracking-wide border-b pb-0.5 transition-colors disabled:opacity-50 ${
              isPublished
                ? "text-muted border-muted hover:text-foreground hover:border-foreground"
                : "text-accent border-accent hover:text-foreground hover:border-foreground"
            }`}
          >
            {publishSaving
              ? "Updating..."
              : isPublished
                ? "Unpublish"
                : "Publish portfolio"}
          </button>
        </div>

        {!isPublished && (
          <p className="text-[11px] font-heading italic text-muted/50 mt-3">
            Your portfolio is not visible to the public while in draft mode.
          </p>
        )}
      </div>
    </div>
  );
}
