"use client";

// ─── Dashboard page card ─────────────────────────────────────────────
// Cover, title, slug, theme, status, visibility, last edited — plus the
// lifecycle actions (edit, view, publish/unpublish, duplicate, delete).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deletePage,
  duplicatePage,
  publishPage,
  unpublishPage,
} from "@/lib/actions/pages";
import { storageUrl } from "@/lib/media";
import { getTheme } from "@/themes/registry";
import type { Page } from "@/types";

export type DashboardPage = Pick<
  Page,
  "id" | "slug" | "title" | "theme" | "cover_path" | "is_published" | "visibility" | "updated_at" | "published_at"
>;

const VISIBILITY_LABEL = { public: "Public", unlisted: "Unlisted", password: "Password" } as const;

function editedLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Edited today";
  if (days === 1) return "Edited yesterday";
  if (days < 30) return `Edited ${days} days ago`;
  return `Edited ${new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

export function PageCard({
  page,
  username,
  views = null,
}: {
  page: DashboardPage;
  username: string;
  /** 30-day view count; null hides the stat (viewer's tier lacks analytics). */
  views?: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmingDelete(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  async function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    setMenuOpen(false);
    setConfirmingDelete(false);
    if (!result.ok) setError(result.error ?? "Something went wrong.");
    else router.refresh();
  }

  return (
    <li className="border border-rule flex flex-col group relative">
      {/* Cover */}
      <Link href={`/editor/${page.id}`} className="block aspect-[4/3] overflow-hidden bg-surface">
        {page.cover_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={storageUrl(page.cover_path)}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted/30 font-heading italic text-3xl">
            {page.title.slice(0, 1) || "?"}
          </div>
        )}
      </Link>

      {/* Meta */}
      <div className="p-4 flex-1 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/editor/${page.id}`} className="min-w-0">
            <h2 className="font-heading italic text-lg font-light leading-snug truncate hover:text-accent transition-colors">
              {page.title}
            </h2>
          </Link>
          <span
            className={`shrink-0 mt-1 text-[9px] uppercase tracking-label px-2 py-0.5 border ${
              page.is_published ? "text-accent border-accent/50" : "text-muted border-rule"
            }`}
          >
            {page.is_published ? "Live" : "Draft"}
          </span>
        </div>
        <p className="text-[11px] text-muted font-copy truncate">/{username}/{page.slug}</p>
        <p className="text-[10px] uppercase tracking-wide text-muted/70">
          {getTheme(page.theme).name} · {VISIBILITY_LABEL[page.visibility]} · {editedLabel(page.updated_at)}
        </p>
        {views !== null && page.is_published && (
          <p className="text-[10px] uppercase tracking-wide text-accent/80">
            {views === 0 ? "No views yet" : `${views.toLocaleString()} view${views === 1 ? "" : "s"}`} · 30 days
          </p>
        )}
        {error && (
          <p className="text-[11px] text-red-400 font-copy" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-rule grid grid-cols-3 text-[10px] uppercase tracking-wide">
        <Link
          href={`/editor/${page.id}`}
          className="py-2.5 text-center text-muted hover:text-foreground hover:bg-surface transition-colors"
        >
          Edit
        </Link>
        {page.is_published ? (
          <a
            href={`/${username}/${page.slug}`}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 text-center text-muted hover:text-foreground hover:bg-surface transition-colors border-x border-rule"
          >
            View
          </a>
        ) : (
          <button
            onClick={() => run(() => publishPage(page.id))}
            disabled={busy}
            className="py-2.5 text-center text-muted hover:text-accent hover:bg-surface transition-colors border-x border-rule disabled:opacity-40"
          >
            Publish
          </button>
        )}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            disabled={busy}
            className="w-full py-2.5 text-center text-muted hover:text-foreground hover:bg-surface transition-colors disabled:opacity-40"
          >
            More
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute bottom-full right-0 mb-1 w-44 bg-background border border-rule shadow-xl z-10"
            >
              {page.is_published && (
                <button
                  role="menuitem"
                  onClick={() => run(() => unpublishPage(page.id))}
                  className="block w-full text-left px-4 py-2.5 text-muted hover:text-foreground hover:bg-surface transition-colors"
                >
                  Unpublish
                </button>
              )}
              <button
                role="menuitem"
                onClick={() => run(() => duplicatePage(page.id))}
                className="block w-full text-left px-4 py-2.5 text-muted hover:text-foreground hover:bg-surface transition-colors"
              >
                Duplicate
              </button>
              {confirmingDelete ? (
                <button
                  role="menuitem"
                  onClick={() => run(() => deletePage(page.id))}
                  className="block w-full text-left px-4 py-2.5 text-red-400 hover:bg-surface transition-colors"
                >
                  Really delete?
                </button>
              ) : (
                <button
                  role="menuitem"
                  onClick={() => setConfirmingDelete(true)}
                  className="block w-full text-left px-4 py-2.5 text-muted hover:text-red-400 hover:bg-surface transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
