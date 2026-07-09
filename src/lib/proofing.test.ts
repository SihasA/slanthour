import { describe, expect, it } from "vitest";
import { newProofingSlug, proofingImageUrl, proofingLimitLabel } from "./proofing";

describe("newProofingSlug", () => {
  it("produces 20 lowercase alphanumeric characters", () => {
    for (let i = 0; i < 50; i++) {
      expect(newProofingSlug()).toMatch(/^[a-z0-9]{20}$/);
    }
  });

  it("never repeats across a batch (the link is the credential)", () => {
    const slugs = new Set(Array.from({ length: 200 }, () => newProofingSlug()));
    expect(slugs.size).toBe(200);
  });
});

describe("proofingImageUrl", () => {
  const path = "user-1/p/gal-1/img-1/md.jpg";

  it("serves the stored md path directly", () => {
    expect(proofingImageUrl(path, "md")).toContain(path);
  });

  it("derives the sm sibling from the md path", () => {
    expect(proofingImageUrl(path, "sm")).toContain("user-1/p/gal-1/img-1/sm.jpg");
  });

  it("never points at lg or xl (proofing is sm/md only)", () => {
    for (const variant of ["sm", "md"] as const) {
      const url = proofingImageUrl(path, variant);
      expect(url).not.toContain("lg.jpg");
      expect(url).not.toContain("xl.jpg");
    }
  });
});

describe("proofingLimitLabel", () => {
  it("prints finite limits as numbers and infinity as Unlimited", () => {
    expect(proofingLimitLabel(3)).toBe("3");
    expect(proofingLimitLabel(Number.POSITIVE_INFINITY)).toBe("Unlimited");
  });
});
