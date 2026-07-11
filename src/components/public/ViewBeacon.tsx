"use client";

// ─── View beacon ──────────────────────────────────────────────────────
// Fires once per mount to record a page view server-side (POST
// /api/views). Rendered only in the unlocked content branch of
// /[username]/[slug] — a password gate that hasn't been passed yet never
// renders this, so a locked view never counts.

import { useEffect, useRef } from "react";

export function ViewBeacon({ pageId }: { pageId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return; // guards React strict-mode's double-invoke
    fired.current = true;
    fetch("/api/views", {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pageId }),
    }).catch(() => {
      // Best effort: a failed beacon should never affect the visitor.
    });
  }, [pageId]);

  return null;
}
