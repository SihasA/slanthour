import { describe, it, expect } from "vitest";
import {
  shareMessage,
  whatsappShareUrl,
  xShareUrl,
  mailtoShareUrl,
  visibilityNote,
} from "./share-intents";

const URL = "https://slanthour.com/ada/venice";

describe("shareMessage", () => {
  it("names the page when it has a title", () => {
    expect(shareMessage("Venice in Winter")).toBe("Venice in Winter — on Slanthour");
  });
  it("falls back gracefully for an empty or whitespace title", () => {
    expect(shareMessage("")).toBe("A page I made on Slanthour");
    expect(shareMessage("   ")).toBe("A page I made on Slanthour");
  });
});

describe("whatsappShareUrl", () => {
  it("folds the link into the single wa.me text field, encoded", () => {
    const out = whatsappShareUrl(URL, "Venice");
    expect(out.startsWith("https://wa.me/?text=")).toBe(true);
    const text = decodeURIComponent(out.split("text=")[1]);
    expect(text).toBe(`Venice — on Slanthour ${URL}`);
  });
});

describe("xShareUrl", () => {
  it("passes url and text as separate encoded params", () => {
    const out = xShareUrl(URL, "Venice");
    const parsed = new global.URL(out);
    expect(parsed.origin + parsed.pathname).toBe("https://twitter.com/intent/tweet");
    expect(parsed.searchParams.get("url")).toBe(URL);
    expect(parsed.searchParams.get("text")).toBe("Venice — on Slanthour");
  });
});

describe("mailtoShareUrl", () => {
  it("builds a mailto with subject and body carrying the link", () => {
    const out = mailtoShareUrl(URL, "Venice");
    expect(out.startsWith("mailto:?")).toBe(true);
    expect(out).toContain("subject=");
    expect(out).toContain("body=");
    // Spaces must be %20 (not +) so mail clients render them correctly.
    expect(out).not.toContain("+");
    const body = decodeURIComponent(out.split("body=")[1]);
    expect(body).toContain(URL);
    expect(body).toContain("Venice — on Slanthour");
  });
  it("uses a generic subject when the title is blank", () => {
    const out = mailtoShareUrl(URL, "");
    const subject = decodeURIComponent(out.split("subject=")[1].split("&")[0]);
    expect(subject).toBe("A page on Slanthour");
  });
});

describe("visibilityNote", () => {
  it("says nothing for a public page", () => {
    expect(visibilityNote("public")).toBeNull();
  });
  it("warns about link-only reach for unlisted", () => {
    expect(visibilityNote("unlisted")).toMatch(/only people with the link/i);
  });
  it("mentions the password for protected pages", () => {
    expect(visibilityNote("password")).toMatch(/password/i);
  });
});
