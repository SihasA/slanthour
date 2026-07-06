import { describe, expect, it } from "vitest";
import { hashPagePassword, verifyPagePassword } from "./page-password";
import { createGateToken, verifyGateToken, pageGateCookieName } from "./page-gate";
import { rateLimit, resetRateLimiter } from "./rate-limit";

describe("page password hashing", () => {
  it("verifies the correct password and rejects wrong ones", async () => {
    const stored = await hashPagePassword("correct horse");
    expect(stored.startsWith("pbkdf2$")).toBe(true);
    expect(stored).not.toContain("correct horse");
    expect(await verifyPagePassword("correct horse", stored)).toBe(true);
    expect(await verifyPagePassword("wrong horse", stored)).toBe(false);
    expect(await verifyPagePassword("", stored)).toBe(false);
  });

  it("produces unique salts per hash", async () => {
    const a = await hashPagePassword("same");
    const b = await hashPagePassword("same");
    expect(a).not.toBe(b);
    expect(await verifyPagePassword("same", a)).toBe(true);
    expect(await verifyPagePassword("same", b)).toBe(true);
  });

  it("rejects malformed stored hashes without throwing", async () => {
    for (const bad of ["", "plaintext", "pbkdf2$notanumber$x$y", "bcrypt$10$x$y", "pbkdf2$10$salt"]) {
      expect(await verifyPagePassword("pw", bad)).toBe(false);
    }
  });
});

describe("page gate tokens", () => {
  const secret = "test-secret";

  it("accepts a valid token for the matching page", async () => {
    const token = await createGateToken("page-1", secret);
    expect(await verifyGateToken(token, "page-1", secret)).toBe(true);
  });

  it("rejects tokens for a different page", async () => {
    const token = await createGateToken("page-1", secret);
    expect(await verifyGateToken(token, "page-2", secret)).toBe(false);
  });

  it("rejects tampered and wrong-secret tokens", async () => {
    const token = await createGateToken("page-1", secret);
    expect(await verifyGateToken(token + "x", "page-1", secret)).toBe(false);
    expect(await verifyGateToken(token, "page-1", "other-secret")).toBe(false);
    expect(await verifyGateToken(undefined, "page-1", secret)).toBe(false);
  });

  it("rejects expired tokens", async () => {
    const past = Date.now() - 1000 * 60 * 60 * 24;
    const token = await createGateToken("page-1", secret, past);
    expect(await verifyGateToken(token, "page-1", secret)).toBe(false);
  });

  it("sanitises page ids in cookie names", () => {
    expect(pageGateCookieName("ab-12")).toBe("sh_gate_ab-12");
    expect(pageGateCookieName("a;b=c d")).toBe("sh_gate_abcd");
  });
});

describe("rate limiter", () => {
  it("allows up to the limit then blocks with retry-after", () => {
    resetRateLimiter();
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      expect(rateLimit("test", "ip1", 5, 60, now).allowed).toBe(true);
    }
    const blocked = rateLimit("test", "ip1", 5, 60, now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("isolates identifiers and resets after the window", () => {
    resetRateLimiter();
    const now = Date.now();
    for (let i = 0; i < 6; i++) rateLimit("test", "ip1", 5, 60, now);
    expect(rateLimit("test", "ip2", 5, 60, now).allowed).toBe(true);
    expect(rateLimit("test", "ip1", 5, 60, now + 61_000).allowed).toBe(true);
  });
});
