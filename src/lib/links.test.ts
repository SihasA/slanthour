import { describe, it, expect } from "vitest";
import {
  safeExternalUrl,
  normalizeWebsiteUrl,
  normalizeInstagramHandle,
  instagramUrl,
  isPlausibleEmail,
  normalizeEmail,
  mailtoHref,
} from "./links";

describe("safeExternalUrl", () => {
  it("rejects the javascript: scheme", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects an uppercase JAVASCRIPT: scheme (protocol is case-insensitive)", () => {
    expect(safeExternalUrl("JAVASCRIPT:alert(1)")).toBeNull();
    expect(safeExternalUrl("  JavaScript:alert(1)")).toBeNull();
  });

  it("rejects a scheme smuggled behind a tab/newline", () => {
    // The URL parser strips tab/newline before parsing, so this resolves
    // to the javascript: protocol and is rejected.
    expect(safeExternalUrl("java\tscript:alert(1)")).toBeNull();
    expect(safeExternalUrl("java\nscript:alert(1)")).toBeNull();
  });

  it("rejects the data: scheme", () => {
    expect(safeExternalUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("rejects the vbscript: scheme", () => {
    expect(safeExternalUrl("vbscript:msgbox(1)")).toBeNull();
  });

  it("rejects mailto: smuggled in as an href", () => {
    expect(safeExternalUrl("mailto:a@b.com")).toBeNull();
  });

  it("rejects a protocol-relative //evil URL", () => {
    expect(safeExternalUrl("//evil.com")).toBeNull();
  });

  it("rejects a plain string that is not a URL", () => {
    expect(safeExternalUrl("not a url")).toBeNull();
  });

  it("rejects empty, whitespace, null and undefined", () => {
    expect(safeExternalUrl("")).toBeNull();
    expect(safeExternalUrl("   ")).toBeNull();
    expect(safeExternalUrl(null)).toBeNull();
    expect(safeExternalUrl(undefined)).toBeNull();
  });

  it("accepts http and https URLs and trims surrounding whitespace", () => {
    expect(safeExternalUrl("http://x.com")).toBe("http://x.com/");
    expect(safeExternalUrl("https://x.com/p")).toBe("https://x.com/p");
    expect(safeExternalUrl("  https://x.com/p  ")).toBe("https://x.com/p");
  });
});

describe("normalizeWebsiteUrl", () => {
  it("assumes https for a bare domain", () => {
    expect(normalizeWebsiteUrl("studio.example.com")).toBe("https://studio.example.com/");
  });

  it("keeps an explicit http(s) scheme", () => {
    expect(normalizeWebsiteUrl("http://a.com")).toBe("http://a.com/");
    expect(normalizeWebsiteUrl("https://a.com/work")).toBe("https://a.com/work");
  });

  it("does not upgrade a hostile scheme to https", () => {
    // Must reject, not become https://javascript:...
    expect(normalizeWebsiteUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeWebsiteUrl("data:text/html,x")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(normalizeWebsiteUrl("")).toBeNull();
    expect(normalizeWebsiteUrl("   ")).toBeNull();
    expect(normalizeWebsiteUrl(null)).toBeNull();
  });
});

describe("normalizeInstagramHandle", () => {
  it("accepts a plain handle", () => {
    expect(normalizeInstagramHandle("jane.doe_99")).toBe("jane.doe_99");
  });

  it("strips a leading @", () => {
    expect(normalizeInstagramHandle("@jane")).toBe("jane");
  });

  it("extracts the handle from a pasted profile URL", () => {
    expect(normalizeInstagramHandle("https://instagram.com/jane.doe")).toBe("jane.doe");
    expect(normalizeInstagramHandle("instagram.com/jane/")).toBe("jane");
  });

  it("rejects illegal characters and overlong handles", () => {
    expect(normalizeInstagramHandle("has space")).toBeNull();
    expect(normalizeInstagramHandle("bad/slash")).toBeNull();
    expect(normalizeInstagramHandle("a".repeat(31))).toBeNull();
    expect(normalizeInstagramHandle("")).toBeNull();
    expect(normalizeInstagramHandle(null)).toBeNull();
  });
});

describe("instagramUrl", () => {
  it("builds a safe https URL for a valid handle", () => {
    expect(instagramUrl("jane")).toBe("https://instagram.com/jane");
    expect(instagramUrl("@jane")).toBe("https://instagram.com/jane");
  });

  it("returns null for an invalid handle", () => {
    expect(instagramUrl("bad handle")).toBeNull();
    expect(instagramUrl(null)).toBeNull();
  });
});

describe("email helpers", () => {
  it("accepts plausible addresses", () => {
    expect(isPlausibleEmail("hi@studio.com")).toBe(true);
    expect(normalizeEmail("  hi@studio.com ")).toBe("hi@studio.com");
    expect(mailtoHref("hi@studio.com")).toBe("mailto:hi@studio.com");
  });

  it("rejects implausible addresses", () => {
    expect(isPlausibleEmail("nope")).toBe(false);
    expect(isPlausibleEmail("a@b")).toBe(false);
    expect(isPlausibleEmail("a b@c.com")).toBe(false);
    expect(normalizeEmail("nope")).toBeNull();
    expect(mailtoHref("nope")).toBeNull();
    expect(mailtoHref(null)).toBeNull();
  });
});
