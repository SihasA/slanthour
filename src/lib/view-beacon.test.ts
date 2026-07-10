import { describe, expect, it } from "vitest";
import { isValidPageId, parseBeaconBody } from "./view-beacon";

const validId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

describe("isValidPageId", () => {
  it("accepts a well-formed UUID", () => {
    expect(isValidPageId(validId)).toBe(true);
  });

  it("rejects non-UUID strings and non-string values", () => {
    expect(isValidPageId("not-a-uuid")).toBe(false);
    expect(isValidPageId(123)).toBe(false);
    expect(isValidPageId(null)).toBe(false);
    expect(isValidPageId(undefined)).toBe(false);
  });
});

describe("parseBeaconBody", () => {
  it("extracts a valid pageId", () => {
    expect(parseBeaconBody({ pageId: validId })).toBe(validId);
  });

  it("rejects a missing pageId, non-objects, and an invalid pageId", () => {
    expect(parseBeaconBody({})).toBeNull();
    expect(parseBeaconBody(null)).toBeNull();
    expect(parseBeaconBody("a string")).toBeNull();
    expect(parseBeaconBody({ pageId: "nope" })).toBeNull();
  });
});
