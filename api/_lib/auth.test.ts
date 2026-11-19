import { describe, expect, it } from "vitest";
import type { DecodedIdToken } from "firebase-admin/auth";
import { ApiError, requireVerifiedEmail } from "./auth.js";

const token = (fields: Partial<DecodedIdToken>) => fields as DecodedIdToken;

describe("requireVerifiedEmail", () => {
  it("returns the normalized e-mail when the provider verified it", () => {
    expect(requireVerifiedEmail(token({ email: "  Ana@Exemplo.COM ", email_verified: true }))).toBe("ana@exemplo.com");
  });

  it("rejects an unverified e-mail, so nobody can claim someone else's address", () => {
    const run = () => requireVerifiedEmail(token({ email: "ana@exemplo.com", email_verified: false }));
    expect(run).toThrow(ApiError);
    expect(run).toThrow(/verificado/);
  });

  it("rejects when email_verified is missing", () => {
    expect(() => requireVerifiedEmail(token({ email: "ana@exemplo.com" }))).toThrow(ApiError);
  });

  it("rejects an account without e-mail", () => {
    expect(() => requireVerifiedEmail(token({ email_verified: true }))).toThrow(ApiError);
  });
});
