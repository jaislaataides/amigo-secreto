import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { deriveLinkToken } from "../crypto/linkTokens.js";
import { resolveMailLinks } from "./send.js";

beforeEach(() => {
  process.env.MASTER_KEK_BASE64 = randomBytes(32).toString("base64");
  process.env.APP_BASE_URL = "https://amico.test/";
});

describe("resolveMailLinks", () => {
  it("builds the invite URL from the nonce at send time", () => {
    const payload = resolveMailLinks({
      template: "invite",
      to: "ana@x.com",
      partyId: "party1",
      participantId: "p1",
      payload: { participantName: "Ana", partyName: "Firma", link: { purpose: "access", nonce: "n1" } },
    });
    const token = deriveLinkToken("access", "party1", "p1", "n1");
    expect(payload.joinUrl).toBe(`https://amico.test/p/party1/rsvp?t=${token}`);
    expect(payload).not.toHaveProperty("link");
  });

  it("builds the reveal URL for reveal links", () => {
    const payload = resolveMailLinks({
      template: "reveal_link",
      to: "ana@x.com",
      partyId: "party1",
      participantId: "p1",
      payload: { link: { purpose: "reveal", nonce: "n2" } },
    });
    const token = deriveLinkToken("reveal", "party1", "p1", "n2");
    expect(payload.revealUrl).toBe(`https://amico.test/reveal/party1/p1?t=${token}`);
  });

  it("leaves payloads without links untouched", () => {
    const payload = { partyName: "Firma" };
    expect(resolveMailLinks({ template: "draw_done_owner", to: "o@x.com", partyId: "party1", payload })).toBe(payload);
  });
});
