import { describe, it, expect } from "vitest";
import { needsMfaChallenge } from "./mfa";

describe("needsMfaChallenge", () => {
  it("requires a challenge when at aal1 but aal2 is expected", () => {
    expect(needsMfaChallenge("aal1", "aal2")).toBe(true);
  });

  it("does not require a challenge when already at aal2", () => {
    expect(needsMfaChallenge("aal2", "aal2")).toBe(false);
  });

  it("does not require a challenge for a plain aal1 account (no verified factor)", () => {
    expect(needsMfaChallenge("aal1", "aal1")).toBe(false);
  });

  it("returns false when either level is null (no session / unknown)", () => {
    expect(needsMfaChallenge(null, null)).toBe(false);
    expect(needsMfaChallenge("aal1", null)).toBe(false);
    expect(needsMfaChallenge(null, "aal2")).toBe(false);
  });
});
