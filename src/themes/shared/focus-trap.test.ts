import { describe, expect, it } from "vitest";
import { nextTrapIndex } from "./focus-trap";

describe("nextTrapIndex", () => {
  it("returns -1 when there is nothing focusable", () => {
    expect(nextTrapIndex(0, -1, 1)).toBe(-1);
    expect(nextTrapIndex(0, 0, -1)).toBe(-1);
  });

  it("advances forward and wraps from the last control to the first", () => {
    expect(nextTrapIndex(3, 0, 1)).toBe(1);
    expect(nextTrapIndex(3, 1, 1)).toBe(2);
    expect(nextTrapIndex(3, 2, 1)).toBe(0);
  });

  it("advances backward and wraps from the first control to the last", () => {
    expect(nextTrapIndex(3, 2, -1)).toBe(1);
    expect(nextTrapIndex(3, 1, -1)).toBe(0);
    expect(nextTrapIndex(3, 0, -1)).toBe(2);
  });

  it("starts at the first control on Tab when nothing tracked is focused", () => {
    expect(nextTrapIndex(3, -1, 1)).toBe(0);
  });

  it("starts at the last control on Shift+Tab when nothing tracked is focused", () => {
    expect(nextTrapIndex(3, -1, -1)).toBe(2);
  });

  it("stays put on the single control (e.g. just the close button)", () => {
    expect(nextTrapIndex(1, 0, 1)).toBe(0);
    expect(nextTrapIndex(1, 0, -1)).toBe(0);
  });
});
