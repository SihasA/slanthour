import { describe, expect, it } from "vitest";
import { KEEPSAKE_ARCHIVE_MAX_IMAGES } from "@/lib/constants";
import { isArchivableImageCount } from "./archive-size";

describe("isArchivableImageCount", () => {
  it("allows a count well under the limit", () => {
    expect(isArchivableImageCount(1)).toBe(true);
  });

  it("allows a count exactly at the limit", () => {
    expect(isArchivableImageCount(KEEPSAKE_ARCHIVE_MAX_IMAGES)).toBe(true);
  });

  it("rejects a count one over the limit", () => {
    expect(isArchivableImageCount(KEEPSAKE_ARCHIVE_MAX_IMAGES + 1)).toBe(false);
  });

  it("rejects an extreme count", () => {
    expect(isArchivableImageCount(10_000)).toBe(false);
  });
});
