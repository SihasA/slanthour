import { describe, expect, it } from "vitest";
import { getEntitlements, getProfileEntitlements, resolveTier } from "./entitlements";

describe("resolveTier", () => {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const past = new Date(Date.now() - 86_400_000).toISOString();

  it("passes through active paid tiers", () => {
    expect(resolveTier("pro", future)).toBe("pro");
    expect(resolveTier("studio", future)).toBe("studio");
  });

  it("treats null expiry as non-lapsing", () => {
    expect(resolveTier("pro", null)).toBe("pro");
    expect(resolveTier("pro", undefined)).toBe("pro");
  });

  it("lapses expired paid tiers to free", () => {
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

    for (const tier of ["pro", "studio"] as const) {
      const e = getEntitlements(tier);
      expect(e.removeBadge).toBe(true);
      expect(e.hiFiUploads).toBe(true);
      expect(e.analytics).toBe(true);
    }
  });

  it("keeps publishing open on every tier", () => {
    expect(getEntitlements("free").canPublish).toBe(true);
    expect(getEntitlements("pro").canPublish).toBe(true);
    expect(getEntitlements("studio").canPublish).toBe(true);
  });

  it("resolves profile fragments through tier expiry", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(getProfileEntitlements({ tier: "pro", tier_expires_at: past }).hiFiUploads).toBe(false);
    expect(getProfileEntitlements({ tier: "pro", tier_expires_at: null }).hiFiUploads).toBe(true);
    expect(getProfileEntitlements(null).maxPages).toBe(5);
  });
});
