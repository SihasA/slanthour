import { describe, expect, it } from "vitest";
import { isBotUserAgent } from "./analytics";

describe("isBotUserAgent", () => {
  it("treats a missing user-agent as a bot", () => {
    expect(isBotUserAgent("")).toBe(true);
  });

  it("recognises known bots and link-preview fetchers", () => {
    expect(isBotUserAgent("facebookexternalhit/1.1")).toBe(true);
    expect(isBotUserAgent("WhatsApp/2.23.20.0")).toBe(true);
    expect(isBotUserAgent("curl/8.4.0")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(
      true
    );
    expect(isBotUserAgent("Mozilla/5.0 HeadlessChrome/119.0.0.0")).toBe(true);
  });

  it("does not flag ordinary browsers", () => {
    expect(
      isBotUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
      )
    ).toBe(false);
    expect(
      isBotUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
      )
    ).toBe(false);
  });
});
