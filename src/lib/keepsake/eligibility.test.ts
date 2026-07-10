import { describe, expect, it } from "vitest";
import { archiveEligibility, type ArchiveEligibilityInput } from "./eligibility";

const ALL_TRUE: ArchiveEligibilityInput = {
  isOwner: true,
  isPublished: true,
  hasPublishedSnapshot: true,
  hasGrant: true,
};

describe("archiveEligibility", () => {
  it("is ok when every condition holds", () => {
    expect(archiveEligibility(ALL_TRUE)).toEqual({ ok: true });
  });

  it("maps a non-owner to 401", () => {
    const result = archiveEligibility({ ...ALL_TRUE, isOwner: false });
    expect(result).toEqual({ ok: false, status: 401, reason: expect.any(String) });
  });

  it("maps a missing Keepsake grant to 403", () => {
    const result = archiveEligibility({ ...ALL_TRUE, hasGrant: false });
    expect(result).toEqual({ ok: false, status: 403, reason: expect.any(String) });
  });

  it("maps an unpublished page to 409", () => {
    const result = archiveEligibility({ ...ALL_TRUE, isPublished: false });
    expect(result).toEqual({ ok: false, status: 409, reason: expect.any(String) });
  });

  it("maps a missing published snapshot to 404", () => {
    const result = archiveEligibility({ ...ALL_TRUE, hasPublishedSnapshot: false });
    expect(result).toEqual({ ok: false, status: 404, reason: expect.any(String) });
  });

  it("checks ownership first when several conditions fail at once", () => {
    const result = archiveEligibility({
      isOwner: false,
      isPublished: false,
      hasPublishedSnapshot: false,
      hasGrant: false,
    });
    expect(result).toEqual({ ok: false, status: 401, reason: expect.any(String) });
  });
});
