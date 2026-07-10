import { describe, expect, it } from "vitest";
import { extractShPage } from "./extract";

function wrapAsFullDocument(shPage: string): string {
  return `<!DOCTYPE html><html><head><title>x</title></head><body><nav>site chrome</nav>${shPage}<footer>site footer</footer></body></html>`;
}

describe("extractShPage", () => {
  it("extracts a simple sh-page subtree out of a full HTML document", () => {
    const shPage = `<div class="sh-page min-h-full" data-theme="monograph"><p>Hello</p></div>`;
    const full = wrapAsFullDocument(shPage);
    expect(extractShPage(full)).toBe(shPage);
  });

  it("balances nested divs correctly, including ones before and after it", () => {
    const shPage = `<div class="sh-page" data-theme="cabinet"><div><div>deep</div></div><div>sibling</div></div>`;
    const full = `<div id="outer-chrome"><div>nav</div></div>${shPage}<div>trailing chrome</div>`;
    expect(extractShPage(full)).toBe(shPage);
  });

  it("is not confused by a literal '<div' inside escaped user text", () => {
    // React escapes user text, so a caption like "a <div> tag" becomes
    // "a &lt;div&gt; tag" in real output — verify escaped text doesn't
    // throw off the balance counter.
    const shPage = `<div class="sh-page"><p>a &lt;div&gt; tag, and &lt;/div&gt; too</p></div>`;
    const full = wrapAsFullDocument(shPage);
    expect(extractShPage(full)).toBe(shPage);
  });

  it("returns null when there's no sh-page element (e.g. a redirected/auth page)", () => {
    expect(extractShPage("<html><body><p>Sign in</p></body></html>")).toBeNull();
  });

  it("returns null for an unbalanced (malformed) document", () => {
    expect(extractShPage(`<div class="sh-page">unclosed`)).toBeNull();
  });

  it("matches class lists where sh-page isn't the only class", () => {
    const shPage = `<div class="sh-page min-h-full extra-class" data-theme="riviera"><span>x</span></div>`;
    expect(extractShPage(wrapAsFullDocument(shPage))).toBe(shPage);
  });
});
