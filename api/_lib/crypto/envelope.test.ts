import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
  decryptAssignment,
  encryptAssignment,
  generatePartyDek,
  generatePossessionToken,
  hashPossessionToken,
  unwrapDek,
  verifyPossessionToken,
  wrapDek,
} from "./envelope";

beforeAll(() => {
  process.env.MASTER_KEK_BASE64 = randomBytes(32).toString("base64");
});

describe("DEK wrap/unwrap", () => {
  it("round-trips the DEK through wrap/unwrap", () => {
    const dek = generatePartyDek();
    const wrapped = wrapDek(dek);
    const unwrapped = unwrapDek(wrapped);
    expect(unwrapped.equals(dek)).toBe(true);
  });

  it("fails to unwrap with a tampered ciphertext", () => {
    const dek = generatePartyDek();
    const wrapped = wrapDek(dek);
    const tampered = {
      ...wrapped,
      wrappedDekB64: Buffer.from("not the real ciphertext").toString("base64"),
    };
    expect(() => unwrapDek(tampered)).toThrow();
  });

  it("fails to unwrap under a different KEK", () => {
    const dek = generatePartyDek();
    const wrapped = wrapDek(dek);
    process.env.MASTER_KEK_BASE64 = randomBytes(32).toString("base64");
    expect(() => unwrapDek(wrapped)).toThrow();
  });
});

describe("assignment encrypt/decrypt", () => {
  it("round-trips the receiver id", () => {
    const dek = generatePartyDek();
    const encrypted = encryptAssignment(dek, "party-1", "giver-1", "receiver-1");
    const decrypted = decryptAssignment(dek, "party-1", "giver-1", encrypted);
    expect(decrypted).toBe("receiver-1");
  });

  it("fails when the ciphertext is moved to a different giver (AAD mismatch)", () => {
    const dek = generatePartyDek();
    const encrypted = encryptAssignment(dek, "party-1", "giver-1", "receiver-1");
    expect(() => decryptAssignment(dek, "party-1", "giver-2", encrypted)).toThrow();
  });

  it("fails when the ciphertext is moved to a different party (AAD mismatch)", () => {
    const dek = generatePartyDek();
    const encrypted = encryptAssignment(dek, "party-1", "giver-1", "receiver-1");
    expect(() => decryptAssignment(dek, "party-2", "giver-1", encrypted)).toThrow();
  });

  it("fails with the wrong DEK", () => {
    const dek = generatePartyDek();
    const otherDek = generatePartyDek();
    const encrypted = encryptAssignment(dek, "party-1", "giver-1", "receiver-1");
    expect(() => decryptAssignment(otherDek, "party-1", "giver-1", encrypted)).toThrow();
  });
});

describe("possession token", () => {
  it("verifies a correct token against its hash", () => {
    const token = generatePossessionToken();
    const hash = hashPossessionToken(token);
    expect(verifyPossessionToken(token, hash)).toBe(true);
  });

  it("rejects an incorrect token", () => {
    const hash = hashPossessionToken(generatePossessionToken());
    const wrongToken = generatePossessionToken();
    expect(verifyPossessionToken(wrongToken, hash)).toBe(false);
  });

  it("rejects a malformed/short stored hash without throwing", () => {
    const token = generatePossessionToken();
    expect(verifyPossessionToken(token, "deadbeef")).toBe(false);
  });

  it("generates tokens with 256 bits of entropy (43-44 base64url chars)", () => {
    const token = generatePossessionToken();
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
