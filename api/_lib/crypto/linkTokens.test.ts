import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { hashPossessionToken } from "./envelope.js";
import { deriveLinkToken, issueLinkToken, verifyLinkToken } from "./linkTokens.js";

beforeEach(() => {
  process.env.MASTER_KEK_BASE64 = randomBytes(32).toString("base64");
});

describe("link tokens", () => {
  it("re-derives the same code from the stored nonce (so e-mails can be rebuilt)", () => {
    const issued = issueLinkToken("access", "party1", "p1");
    expect(deriveLinkToken("access", "party1", "p1", issued.nonce)).toBe(issued.token);
  });

  it("stores only a hash: the hash verifies the code, not the other way round", () => {
    const issued = issueLinkToken("access", "party1", "p1");
    expect(issued.tokenHash).toBe(hashPossessionToken(issued.token));
    expect(issued.tokenHash).not.toContain(issued.token);
    expect(verifyLinkToken(issued.token, issued.tokenHash)).toBe(true);
  });

  it("binds the code to purpose, party and participant", () => {
    const { nonce, token, tokenHash } = issueLinkToken("access", "party1", "p1");
    expect(deriveLinkToken("reveal", "party1", "p1", nonce)).not.toBe(token);
    expect(deriveLinkToken("access", "party2", "p1", nonce)).not.toBe(token);
    const otherPerson = deriveLinkToken("access", "party1", "p2", nonce);
    expect(verifyLinkToken(otherPerson, tokenHash)).toBe(false);
  });

  it("a new nonce invalidates the previous link (resend)", () => {
    const first = issueLinkToken("access", "party1", "p1");
    const second = issueLinkToken("access", "party1", "p1");
    expect(verifyLinkToken(first.token, second.tokenHash)).toBe(false);
  });

  it("can't be forged without the server key", () => {
    const issued = issueLinkToken("access", "party1", "p1");
    process.env.MASTER_KEK_BASE64 = randomBytes(32).toString("base64");
    expect(deriveLinkToken("access", "party1", "p1", issued.nonce)).not.toBe(issued.token);
  });
});
