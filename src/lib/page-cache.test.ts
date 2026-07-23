import { describe, expect, it } from "vitest";
import { pageCacheTag, profileCacheTag, PUBLISHED_PAGE_REVALIDATE } from "./page-cache";

describe("pageCacheTag", () => {
  it("is stable for the same inputs", () => {
    expect(pageCacheTag("alice", "wedding")).toBe(pageCacheTag("alice", "wedding"));
  });

  it("is distinct per username and per slug", () => {
    expect(pageCacheTag("alice", "wedding")).not.toBe(pageCacheTag("bob", "wedding"));
    expect(pageCacheTag("alice", "wedding")).not.toBe(pageCacheTag("alice", "portraits"));
  });

  it("cannot collide across a literal separator inside a part", () => {
    expect(pageCacheTag("a", "b:c")).not.toBe(pageCacheTag("a:b", "c"));
  });
});

describe("profileCacheTag", () => {
  it("is stable for the same input", () => {
    expect(profileCacheTag("alice")).toBe(profileCacheTag("alice"));
  });

  it("is distinct per username", () => {
    expect(profileCacheTag("alice")).not.toBe(profileCacheTag("bob"));
  });

  it("cannot collide with a pageCacheTag-style key", () => {
    expect(profileCacheTag("alice")).not.toBe(pageCacheTag("alice", "wedding"));
    expect(profileCacheTag("a:b")).not.toBe(pageCacheTag("a", "b"));
  });
});

describe("PUBLISHED_PAGE_REVALIDATE", () => {
  it("is one hour", () => {
    expect(PUBLISHED_PAGE_REVALIDATE).toBe(3600);
  });
});
