import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  THEME_IDS,
  THEMES,
  defaultThemeSettings,
  getTheme,
  isThemeId,
  resolveThemeTokens,
  sanitizeThemeSettings,
  themeCssVars,
} from "./registry";

describe("theme registry", () => {
  it("contains exactly the five product themes", () => {
    expect(THEME_IDS.sort()).toEqual(["afterdark", "cabinet", "keepsake", "monograph", "roll36"]);
  });

  it("every theme has complete metadata and a valid settings schema", () => {
    for (const id of THEME_IDS) {
      const theme = THEMES[id];
      expect(theme.id).toBe(id);
      expect(theme.name.length).toBeGreaterThan(0);
      expect(theme.description.length).toBeGreaterThan(0);
      expect(theme.settingsSchema.length).toBeGreaterThanOrEqual(4);
      const keys = theme.settingsSchema.map((d) => d.key);
      expect(new Set(keys).size).toBe(keys.length); // no duplicate keys
      for (const def of theme.settingsSchema) {
        if (def.type === "select") {
          expect(def.options.length).toBeGreaterThanOrEqual(2);
          expect(def.options.some((o) => o.value === def.default)).toBe(true);
        }
      }
    }
  });

  it("resolves tokens for defaults and for every select option", () => {
    for (const id of THEME_IDS) {
      const theme = THEMES[id];
      const base = defaultThemeSettings(id);
      expect(theme.resolveTokens(base).background).toMatch(/^#/);
      for (const def of theme.settingsSchema) {
        if (def.type !== "select") continue;
        for (const option of def.options) {
          const tokens = theme.resolveTokens({ ...base, [def.key]: option.value });
          expect(tokens.background, `${id}.${def.key}=${option.value}`).toMatch(/^#[0-9a-f]{6}$/i);
          expect(tokens.text).toMatch(/^#[0-9a-f]{6}$/i);
          expect(tokens.headingFont).toContain("var(");
        }
      }
    }
  });

  it("falls back to the default theme for unknown ids", () => {
    expect(isThemeId("editorial")).toBe(false);
    expect(getTheme("bogus").id).toBe(DEFAULT_THEME);
  });
});

describe("sanitizeThemeSettings", () => {
  it("drops unknown keys and fixes invalid values", () => {
    const settings = sanitizeThemeSettings("monograph", {
      paper: "dark",
      rhythm: "hyperspeed",
      injected: "<script>",
      chapterNumbers: "yes",
    });
    expect(settings.paper).toBe("dark");
    expect(settings.rhythm).toBe("balanced"); // invalid → default
    expect(settings.chapterNumbers).toBe(false); // non-boolean → default
    expect("injected" in settings).toBe(false);
    expect(settings._v).toBe("1");
  });

  it("handles junk input without throwing", () => {
    for (const junk of [null, undefined, [], "x", 42]) {
      const settings = sanitizeThemeSettings("cabinet", junk);
      expect(settings.numbering).toBe(true);
    }
  });

  it("settings from one theme are ignored safely under another (theme switch)", () => {
    const roll = sanitizeThemeSettings("roll36", defaultThemeSettings("keepsake"));
    expect(roll.surface).toBe("darkroom");
    expect("rotation" in roll).toBe(false);
  });
});

describe("themeCssVars", () => {
  it("maps every token the renderers rely on", () => {
    const vars = themeCssVars(resolveThemeTokens("afterdark", {}));
    for (const key of ["--sh-bg", "--sh-text", "--sh-accent", "--sh-heading", "--sh-body", "--sh-gap"]) {
      expect(vars[key], key).toBeTruthy();
    }
  });
});
