import { describe, expect, it } from "vitest";
import { effectiveRsvp } from "./party.js";

describe("effectiveRsvp", () => {
  it("counts the organizer as confirmed when still pending (no invite e-mail to answer)", () => {
    expect(effectiveRsvp({ isOwner: true, rsvp: "pending" })).toBe("going");
  });

  it("respects the organizer opting out", () => {
    expect(effectiveRsvp({ isOwner: true, rsvp: "not_going" })).toBe("not_going");
  });

  it("leaves invited participants as they are", () => {
    expect(effectiveRsvp({ rsvp: "pending" })).toBe("pending");
    expect(effectiveRsvp({ isOwner: false, rsvp: "going" })).toBe("going");
  });
});
