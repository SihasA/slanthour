import { describe, expect, it } from "vitest";
import { getEntitlements, getProfileEntitlements, resolveTier } from "./entitlements";

describe("resolveTier", () => {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const past = new Date(Date.now() - 86_400_000).toISOString();

  it("passes through active paid tiers", () => {
    expect(resolveTier("hobby", future)).toBe("hobby");
    expect(resolveTier("pro", future)).toBe("pro");
    expect(resolveTier("studio", future)).toBe("studio");
  });

  it("treats null expiry as non-lapsing", () => {
    expect(resolveTier("pro", null)).toBe("pro");
    expect(resolveTier("pro", undefined)).toBe("pro");
  });

  it("lapses expired paid tiers to free", () => {
    expect(resolveTier("hobby", past)).toBe("free");
    expect(resolveTier("pro", past)).toBe("free");
    expect(resolveTier("studio", past)).toBe("free");
  });

  it("falls back to free for missing or unknown tiers", () => {
    expect(resolveTier(null)).toBe("free");
    expect(resolveTier(undefined)).toBe("free");
    expect(resolveTier("enterprise" as never)).toBe("free");
  });

  it("ignores expiry on free", () => {
    expect(resolveTier("free", past)).toBe("free");
  });
});

describe("entitlements", () => {
  it("gates badge removal, hi-fi uploads and analytics to paid tiers", () => {
    const free = getEntitlements("free");
    expect(free.removeBadge).toBe(false);
    expect(free.hiFiUploads).toBe(false);
    expect(free.analytics).toBe(false);

    // Hobby buys badge removal only; pro tooling stays with Pro and Studio.
    const hobby = getEntitlements("hobby");
    expect(hobby.removeBadge).toBe(true);
    expect(hobby.hiFiUploads).toBe(false);
    expect(hobby.analytics).toBe(false);

    for (const tier of ["pro", "studio"] as const) {
      const e = getEntitlements(tier);
      expect(e.removeBadge).toBe(true);
      expect(e.hiFiUploads).toBe(true);
      expect(e.analytics).toBe(true);
    }
  });

  it("steps limits up the ladder", () => {
    const ladder = (["free", "hobby", "pro", "studio"] as const).map(getEntitlements);
    for (let i = 1; i < ladder.length; i++) {
      expect(ladder[i].maxPages).toBeGreaterThan(ladder[i - 1].maxPages);
      expect(ladder[i].maxImagesPerPage).toBeGreaterThan(ladder[i - 1].maxImagesPerPage);
    }
  });

  it("keeps publishing open on every tier", () => {
    expect(getEntitlements("free").canPublish).toBe(true);
    expect(getEntitlements("hobby").canPublish).toBe(true);
    expect(getEntitlements("pro").canPublish).toBe(true);
    expect(getEntitlements("studio").canPublish).toBe(true);
  });

  it("gates proofing galleries to Pro and Studio", () => {
    expect(getEntitlements("free").proofingGalleries).toBe(0);
    expect(getEntitlements("hobby").proofingGalleries).toBe(0);
    expect(getEntitlements("pro").proofingGalleries).toBe(3);
    expect(getEntitlements("studio").proofingGalleries).toBe(Number.POSITIVE_INFINITY);
  });

  it("drops proofing back to zero when a Pro plan lapses", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(getProfileEntitlements({ tier: "pro", tier_expires_at: past }).proofingGalleries).toBe(0);
  });

  it("resolves profile fragments through tier expiry", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(getProfileEntitlements({ tier: "pro", tier_expires_at: past }).hiFiUploads).toBe(false);
    expect(getProfileEntitlements({ tier: "pro", tier_expires_at: null }).hiFiUploads).toBe(true);
    expect(getProfileEntitlements(null).maxPages).toBe(3);
  });
});
