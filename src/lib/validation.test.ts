import { describe, expect, it } from "vitest";
import { slugify, validatePagePassword, validateSlug, validateUsername } from "./validation";

describe("slugify", () => {
  it("normalises arbitrary titles", () => {
    expect(slugify("Summer in Lisbon!")).toBe("summer-in-lisbon");
    expect(slugify("  --Hello  World--  ")).toBe("hello-world");
    expect(slugify("Café São Paulo")).toBe("cafe-sao-paulo");
  });

  it("caps length at 60", () => {
    expect(slugify("a".repeat(100)).length).toBeLessThanOrEqual(60);
  });
});

describe("validateSlug", () => {
  it("accepts valid slugs", () => {
    for (const slug of ["portfolio", "trip-2026", "a", "x1", "roll-36"]) {
      expect(validateSlug(slug).ok, slug).toBe(true);
    }
  });

  it("rejects invalid formats", () => {
    for (const slug of ["", "-lead", "trail-", "UPPER", "sp ace", "under_score", "dot.dot", "a".repeat(61)]) {
      expect(validateSlug(slug).ok, slug).toBe(false);
    }
  });

  it("rejects reserved words", () => {
    for (const slug of ["api", "dashboard", "editor", "settings", "login", "arborai", "new"]) {
      expect(validateSlug(slug).ok, slug).toBe(false);
    }
  });
});

describe("validateUsername", () => {
  it("accepts valid usernames", () => {
    expect(validateUsername("sihas").ok).toBe(true);
    expect(validateUsername("jane-doe-99").ok).toBe(true);
  });

  it("rejects short, reserved, and malformed usernames", () => {
    for (const name of ["ab", "", "Admin", "api", "pricing", "-x-", "a b"]) {
      expect(validateUsername(name).ok, name).toBe(false);
    }
  });
});

describe("validatePagePassword", () => {
  it("enforces bounds", () => {
    expect(validatePagePassword("abc").ok).toBe(false);
    expect(validatePagePassword("abcd").ok).toBe(true);
    expect(validatePagePassword("x".repeat(73)).ok).toBe(false);
  });
});
