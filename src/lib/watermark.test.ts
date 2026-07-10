import { describe, expect, it } from "vitest";
import { resolveWatermarkLabel } from "./watermark";

describe("resolveWatermarkLabel", () => {
  it("prefers the display name", () => {
    expect(resolveWatermarkLabel("Jane Doe", "janedoe")).toBe("Jane Doe");
  });

  it("falls back to @username when display name is empty", () => {
    expect(resolveWatermarkLabel("", "janedoe")).toBe("@janedoe");
    expect(resolveWatermarkLabel(null, "janedoe")).toBe("@janedoe");
    expect(resolveWatermarkLabel(undefined, "janedoe")).toBe("@janedoe");
  });

  it("trims the display name before using it", () => {
    expect(resolveWatermarkLabel("  Jane Doe  ", "janedoe")).toBe("Jane Doe");
  });

  it("is empty when both display name and username are blank", () => {
    expect(resolveWatermarkLabel("", "")).toBe("");
    expect(resolveWatermarkLabel(null, null)).toBe("");
    expect(resolveWatermarkLabel("   ", null)).toBe("");
  });

  it("clamps to 40 characters", () => {
    const long = "A".repeat(80);
    expect(resolveWatermarkLabel(long, "janedoe")).toHaveLength(40);
    expect(resolveWatermarkLabel("", "u".repeat(80))).toHaveLength(40);
  });

  it("clamps by code point so an emoji is never split into a lone surrogate", () => {
    // 39 ASCII + an astral emoji: a UTF-16 slice(0,40) would cut mid-emoji
    // and leave a lone high surrogate. Code-point clamping keeps 40 whole
    // characters (the emoji dropped), so no orphaned surrogate remains.
    const label = resolveWatermarkLabel("A".repeat(39) + "\u{1F600}tail", null);
    expect([...label]).toHaveLength(40);
    expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(label)).toBe(false);
  });
});
