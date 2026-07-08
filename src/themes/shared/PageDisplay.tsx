"use client";

// ─── Page display context ────────────────────────────────────────────
// Carries the document's display settings (photo protection, serving cap)
// from PageRenderer down to SmartImage and the Lightbox, so every theme
// gets both behaviors without knowing they exist. Protection blocks
// right-click and drag on photos; it deters casual copying only, and the
// editor copy says so honestly.

import { createContext, useContext } from "react";
import { DEFAULT_DISPLAY_SETTINGS, type PageDisplaySettings } from "@/lib/page-document";
import type { MediaVariant } from "@/lib/media";

const PageDisplayContext = createContext<PageDisplaySettings>(DEFAULT_DISPLAY_SETTINGS);

export const PageDisplayProvider = PageDisplayContext.Provider;

export function usePageDisplay(): PageDisplaySettings {
  return useContext(PageDisplayContext);
}

/** The serving cap as a media variant, or undefined when uncapped. */
export function servingCap(settings: PageDisplaySettings): MediaVariant | undefined {
  return settings.maxPhotoRes === "md" ? "md" : undefined;
}
