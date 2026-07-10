// ─── Archive image collection ─────────────────────────────────────────
// Every image a published document renders, deduped to one file per asset
// (an asset can appear in several sections), in document order so the
// exported filenames read naturally when browsed offline.

import { sectionImages, type PageDocument, type PageImage } from "@/lib/page-document";

export interface ArchiveImageEntry {
  image: PageImage;
  /** Zero-padded, stable within one export ("001", "002", ...). */
  localKey: string;
  /** Path inside the zip, e.g. "images/001.jpg". */
  localPath: string;
}

/** Collect + dedupe every image a document's sections reference. Pure —
 * takes no position on which variant/watermark gets fetched (that's the
 * route handler's job, mirroring exactly what the render referenced). */
export function collectArchiveImages(document: PageDocument): ArchiveImageEntry[] {
  const seen = new Set<string>();
  const entries: ArchiveImageEntry[] = [];
  let count = 0;

  for (const section of document.sections) {
    for (const image of sectionImages(section)) {
      const key = image.assetId ?? image.path;
      if (seen.has(key)) continue;
      seen.add(key);
      count += 1;
      const localKey = String(count).padStart(3, "0");
      entries.push({ image, localKey, localPath: `images/${localKey}.jpg` });
    }
  }

  return entries;
}
