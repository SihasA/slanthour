"use client";

// ─── Publish celebration ─────────────────────────────────────────────
// The emotional peak of the product. A restrained editorial reveal shown
// once a publish succeeds: the live link big and one-tap copyable, native
// Web Share plus WhatsApp / X / email fallbacks, and a preview of how the
// link will unfurl. Everything here is feature-detected (navigator.share,
// navigator.clipboard) with graceful fallbacks, so it degrades cleanly on
// any browser. No dependency — every share target is a plain intent URL.
//
// Motion respects prefers-reduced-motion: the animation only runs under
// `no-preference`; otherwise the panel simply appears in its final state.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  whatsappShareUrl,
  xShareUrl,
  mailtoShareUrl,
  shareMessage,
  visibilityNote,
} from "@/lib/share-intents";
import type { Visibility } from "@/types";

type Props = {
  /** Absolute, shareable page URL (https://slanthour.com/user/slug). */
  url: string;
  title: string;
  visibility: Visibility;
  /** Public URL of the frozen cover, for the unfurl preview only. */
  coverUrl: string | null;
  onClose: () => void;
};

/** Copy text to the clipboard, falling back to a hidden-textarea + execCommand
 * on browsers without the async Clipboard API (or non-secure contexts). */
async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy path
    }
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function PublishCelebration({ url, title, visibility, coverUrl, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const note = visibilityNote(visibility);

  // Feature-detect on the client only (SSR has no navigator).
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  useEffect(() => () => {
    if (copyResetRef.current) clearTimeout(copyResetRef.current);
  }, []);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(url);
    setCopied(ok);
    setCopyFailed(!ok);
    if (copyResetRef.current) clearTimeout(copyResetRef.current);
    copyResetRef.current = setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, 2200);
  }, [url]);

  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({ title: title || "Slanthour", text: shareMessage(title), url });
    } catch {
      // User cancelled or share failed — nothing to surface.
    }
  }, [title, url]);

  // The URL without its scheme, for a cleaner large display.
  const displayUrl = url.replace(/^https?:\/\//, "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Page published"
    >
      <style>{`
        @keyframes sh-backdrop { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sh-panel { from { opacity: 0; transform: translateY(10px) scale(0.985) } to { opacity: 1; transform: none } }
        @keyframes sh-tick { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes sh-rise { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        .sh-backdrop { opacity: 1 }
        .sh-panel { opacity: 1 }
        .sh-tick { transform: scaleX(1); transform-origin: left center }
        .sh-rise { opacity: 1 }
        @media (prefers-reduced-motion: no-preference) {
          .sh-backdrop { animation: sh-backdrop .35s ease-out both }
          .sh-panel { animation: sh-panel .5s cubic-bezier(0.16,1,0.3,1) both }
          .sh-tick { animation: sh-tick .6s cubic-bezier(0.16,1,0.3,1) .15s both; transform-origin: left center }
          .sh-rise { animation: sh-rise .5s ease-out both }
          .sh-d1 { animation-delay: .1s }
          .sh-d2 { animation-delay: .18s }
          .sh-d3 { animation-delay: .26s }
        }
      `}</style>

      {/* Backdrop */}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="sh-backdrop absolute inset-0 bg-background/85 backdrop-blur-sm cursor-default"
      />

      {/* Panel */}
      <div className="sh-panel relative w-full max-w-lg max-h-[92vh] overflow-y-auto border border-rule bg-surface shadow-2xl">
        {/* grain-free hairline frame accent */}
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="sh-tick block h-px w-8 bg-accent rotate-[-18deg]" />
                <span className="text-[9px] font-body uppercase tracking-label text-accent">Published</span>
              </div>
              <h2 className="sh-rise sh-d1 mt-3 font-heading italic text-2xl sm:text-[28px] leading-tight text-foreground">
                Your page is live.
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 text-muted hover:text-foreground text-lg leading-none -mt-1"
            >
              ×
            </button>
          </div>

          {/* Unfurl preview — a small echo of the OG link card. */}
          <div className="sh-rise sh-d1 mt-6">
            <div className="text-[9px] font-body uppercase tracking-label text-muted mb-2">
              How your link will look
            </div>
            <div className="relative w-full overflow-hidden border border-rule bg-background aspect-[1200/630]">
              {coverUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverUrl}
                    alt=""
                    className="absolute inset-y-0 right-0 h-full w-[58%] object-cover"
                  />
                  <div
                    className="absolute inset-y-0"
                    style={{
                      left: "42%",
                      width: "28%",
                      background:
                        "linear-gradient(to right, #0a0908 0%, rgba(10,9,8,0.75) 45%, rgba(10,9,8,0) 100%)",
                    }}
                  />
                </>
              )}
              <div className="absolute left-[6%] bottom-[12%] right-[46%]">
                <span className="block h-px w-6 bg-accent rotate-[-18deg] mb-2" />
                <div className="font-heading italic text-foreground text-[clamp(11px,3.2vw,20px)] leading-snug line-clamp-2">
                  {title || "Untitled"}
                </div>
                <div className="mt-1 text-[8px] font-body uppercase tracking-label text-muted">
                  slanthour.com
                </div>
              </div>
            </div>
          </div>

          {/* Live URL + one-tap copy */}
          <div className="sh-rise sh-d2 mt-6">
            <div className="text-[9px] font-body uppercase tracking-label text-muted mb-2">Your link</div>
            <div className="flex items-stretch gap-2">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-0 truncate border border-rule bg-background px-3 py-3 font-heading text-base sm:text-lg text-foreground hover:border-accent transition-colors"
                title={url}
              >
                {displayUrl}
              </a>
              <button
                type="button"
                onClick={() => void handleCopy()}
                aria-live="polite"
                className={`shrink-0 px-4 py-3 text-[10px] font-body uppercase tracking-wide transition-colors ${
                  copied
                    ? "bg-foreground text-background"
                    : "bg-accent text-background hover:bg-foreground"
                }`}
              >
                {copied ? "Copied" : copyFailed ? "Select + copy" : "Copy link"}
              </button>
            </div>
            {copyFailed && (
              <p className="mt-2 text-[11px] text-muted">
                Copy is blocked here. Tap the link above and copy it manually.
              </p>
            )}
            {note && <p className="mt-3 text-[11px] leading-relaxed text-muted">{note}</p>}
          </div>

          {/* Share row */}
          <div className="sh-rise sh-d3 mt-6">
            <div className="text-[9px] font-body uppercase tracking-label text-muted mb-2">Share it</div>
            <div className="flex flex-wrap gap-2">
              {canNativeShare && (
                <button
                  type="button"
                  onClick={() => void handleNativeShare()}
                  className="flex-1 min-w-[120px] px-4 py-3 text-[10px] font-body uppercase tracking-wide bg-foreground text-background hover:bg-accent transition-colors"
                >
                  Share
                </button>
              )}
              <a
                href={whatsappShareUrl(url, title)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-[92px] text-center px-4 py-3 text-[10px] font-body uppercase tracking-wide border border-rule text-foreground hover:border-accent transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={xShareUrl(url, title)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-[92px] text-center px-4 py-3 text-[10px] font-body uppercase tracking-wide border border-rule text-foreground hover:border-accent transition-colors"
              >
                X
              </a>
              <a
                href={mailtoShareUrl(url, title)}
                className="flex-1 min-w-[92px] text-center px-4 py-3 text-[10px] font-body uppercase tracking-wide border border-rule text-foreground hover:border-accent transition-colors"
              >
                Email
              </a>
            </div>
          </div>

          {/* Footer: view + done */}
          <div className="mt-7 flex items-center justify-between">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-body uppercase tracking-wide text-foreground underline underline-offset-4 hover:text-accent transition-colors"
            >
              View page ↗
            </a>
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-body uppercase tracking-wide text-muted hover:text-foreground transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
