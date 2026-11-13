import { describe, expect, it } from "vitest";
import { renderMailTemplate } from "./templates";

describe("renderMailTemplate", () => {
  it("renders the invite email with the join link and party name", async () => {
    const { subject, html } = await renderMailTemplate("invite", {
      participantName: "Fulano",
      partyName: "Natal da Firma",
      joinUrl: "https://example.com/p/abc/rsvp",
    });
    expect(subject).toContain("Natal da Firma");
    expect(html).toContain("Fulano");
    expect(html).toContain("https://example.com/p/abc/rsvp");
  });

  it("renders the reveal link email with the personal link", async () => {
    const { html } = await renderMailTemplate("reveal_link", {
      participantName: "Fulano",
      partyName: "Natal da Firma",
      revealUrl: "https://example.com/reveal/abc/xyz?t=secret-token",
    });
    expect(html).toContain("https://example.com/reveal/abc/xyz?t=secret-token");
  });

  it("renders the infeasible-draw email listing over-constrained participants", async () => {
    const { html } = await renderMailTemplate("draw_infeasible_owner", {
      partyName: "Natal da Firma",
      overConstrainedNames: ["Alice", "Bob"],
    });
    expect(html).toContain("Alice");
    expect(html).toContain("Bob");
  });

  it("throws for an unknown template", async () => {
    // @ts-expect-error testando o fallback em runtime
    await expect(renderMailTemplate("not-a-template", {})).rejects.toThrow();
  });
});
