import { describe, expect, it } from "vitest";
import { buildForbiddenMap, type ExclusionInput, runDerangementDraw } from "./derangement";

function assertValidDerangement(
  participantIds: string[],
  assignments: Map<string, string>,
  exclusions: ExclusionInput[],
) {
  const forbidden = buildForbiddenMap(participantIds, exclusions);

  // Bijeção: todo mundo dá e recebe exatamente um presente.
  expect(assignments.size).toBe(participantIds.length);
  const receivers = new Set(assignments.values());
  expect(receivers.size).toBe(participantIds.length);

  for (const giver of participantIds) {
    const receiver = assignments.get(giver);
    expect(receiver).toBeDefined();
    expect(receiver).not.toBe(giver); // ninguém tira a si mesmo
    expect(forbidden.get(giver)?.has(receiver!)).toBe(false); // respeita exclusões
  }
}

describe("runDerangementDraw", () => {
  it("produces a valid derangement with no exclusions", () => {
    const participantIds = ["a", "b", "c", "d", "e"];
    const result = runDerangementDraw(participantIds, []);
    expect(result.ok).toBe(true);
    if (result.ok) assertValidDerangement(participantIds, result.assignments, []);
  });

  it("respects pair exclusions (e.g. couples)", () => {
    const participantIds = ["a", "b", "c", "d", "e", "f"];
    const exclusions: ExclusionInput[] = [
      { type: "pair", participantIds: ["a", "b"] },
      { type: "pair", participantIds: ["c", "d"] },
    ];
    const result = runDerangementDraw(participantIds, exclusions);
    expect(result.ok).toBe(true);
    if (result.ok) assertValidDerangement(participantIds, result.assignments, exclusions);
  });

  it("respects group exclusions (no one in the group draws another in the group)", () => {
    const participantIds = ["a", "b", "c", "d", "e", "f", "g"];
    const exclusions: ExclusionInput[] = [{ type: "group", participantIds: ["a", "b", "c"] }];
    const result = runDerangementDraw(participantIds, exclusions);
    expect(result.ok).toBe(true);
    if (result.ok) assertValidDerangement(participantIds, result.assignments, exclusions);
  });

  it("finds a valid assignment under sparse ring-shaped constraints (stresses the fallback paths)", () => {
    // Cada participante só pode dar presente para seus dois "vizinhos" num
    // anel — poucas opções por giver, improvável de cair só por sorte.
    const n = 10;
    const participantIds = Array.from({ length: n }, (_, i) => `p${i}`);
    const exclusions: ExclusionInput[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const isNeighbor = (j - i + n) % n === 1 || (i - j + n) % n === 1;
        if (!isNeighbor) {
          exclusions.push({ type: "pair", participantIds: [participantIds[i]!, participantIds[j]!] });
        }
      }
    }
    const result = runDerangementDraw(participantIds, exclusions);
    expect(result.ok).toBe(true);
    if (result.ok) assertValidDerangement(participantIds, result.assignments, exclusions);
  });

  it("detects a mathematically infeasible draw", () => {
    // "a" fica isolado: proibido de tirar/ser tirado por qualquer outro.
    const participantIds = ["a", "b", "c", "d"];
    const exclusions: ExclusionInput[] = [{ type: "group", participantIds: ["a", "b", "c", "d"] }];
    const result = runDerangementDraw(participantIds, exclusions);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("INFEASIBLE");
      expect(result.overConstrainedParticipantIds.length).toBeGreaterThan(0);
      expect(participantIds).toEqual(expect.arrayContaining(result.overConstrainedParticipantIds));
    }
  });

  it("throws for fewer than 3 participants", () => {
    expect(() => runDerangementDraw(["a", "b"], [])).toThrow();
  });

  it("completes quickly for a larger group with no exclusions", () => {
    const participantIds = Array.from({ length: 60 }, (_, i) => `p${i}`);
    const start = Date.now();
    const result = runDerangementDraw(participantIds, []);
    expect(Date.now() - start).toBeLessThan(1000);
    expect(result.ok).toBe(true);
    if (result.ok) assertValidDerangement(participantIds, result.assignments, []);
  });
});

describe("buildForbiddenMap", () => {
  it("always forbids self-assignment even with no exclusions", () => {
    const forbidden = buildForbiddenMap(["a", "b"], []);
    expect(forbidden.get("a")?.has("a")).toBe(true);
    expect(forbidden.get("a")?.has("b")).toBe(false);
  });

  it("expands a group into all internal ordered pairs", () => {
    const forbidden = buildForbiddenMap(["a", "b", "c", "d"], [
      { type: "group", participantIds: ["a", "b", "c"] },
    ]);
    expect(forbidden.get("a")?.has("b")).toBe(true);
    expect(forbidden.get("a")?.has("c")).toBe(true);
    expect(forbidden.get("b")?.has("a")).toBe(true);
    expect(forbidden.get("a")?.has("d")).toBe(false);
  });
});
