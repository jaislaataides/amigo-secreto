import { randomInt } from "node:crypto";

export interface ExclusionInput {
  type: "pair" | "group";
  participantIds: string[];
}

export interface DrawSuccess {
  ok: true;
  /** giverParticipantId -> receiverParticipantId */
  assignments: Map<string, string>;
}

export interface DrawFailure {
  ok: false;
  reason: "INFEASIBLE";
  /**
   * Participantes que, na tentativa de matching máximo, ficaram sem nenhum
   * receptor válido — diagnóstico acionável para o owner relaxar exclusões.
   * Não é necessariamente "a única causa", mas é sempre um subconjunto real
   * de participantes sem alternativa na melhor atribuição encontrada.
   */
  overConstrainedParticipantIds: string[];
}

export type DrawOutcome = DrawSuccess | DrawFailure;

const MAX_RANDOM_ATTEMPTS = 500;
const BACKTRACK_TIME_BUDGET_MS = 2000;

/**
 * Expande exclusões (pares e grupos) num mapa giver -> conjunto de
 * receptores proibidos. Toda pessoa já começa proibida de se tirar.
 */
export function buildForbiddenMap(
  participantIds: readonly string[],
  exclusions: ExclusionInput[],
): Map<string, Set<string>> {
  const forbidden = new Map<string, Set<string>>();
  for (const id of participantIds) {
    forbidden.set(id, new Set([id]));
  }
  for (const exclusion of exclusions) {
    for (const a of exclusion.participantIds) {
      for (const b of exclusion.participantIds) {
        if (a === b) continue;
        forbidden.get(a)?.add(b);
      }
    }
  }
  return forbidden;
}

function fisherYatesShuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function isValidPermutation(
  givers: readonly string[],
  receivers: readonly string[],
  forbidden: Map<string, Set<string>>,
): boolean {
  for (let i = 0; i < givers.length; i++) {
    if (forbidden.get(givers[i]!)?.has(receivers[i]!)) {
      return false;
    }
  }
  return true;
}

function zip(givers: readonly string[], receivers: readonly string[]): Map<string, string> {
  const map = new Map<string, string>();
  givers.forEach((giver, i) => map.set(giver, receivers[i]!));
  return map;
}

/** Caminho feliz: embaralha e valida. Resolve a vasta maioria dos casos reais. */
function tryRandomShuffle(
  participantIds: readonly string[],
  forbidden: Map<string, Set<string>>,
  attempts = MAX_RANDOM_ATTEMPTS,
): string[] | null {
  for (let i = 0; i < attempts; i++) {
    const candidate = fisherYatesShuffle(participantIds);
    if (isValidPermutation(participantIds, candidate, forbidden)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Backtracking com heurística MRV (minimum remaining values): a cada passo,
 * atribui primeiro o giver com menos receptores viáveis restantes — reduz
 * drasticamente a árvore de busca em grafos com exclusões densas.
 */
function backtrackWithMrv(
  participantIds: readonly string[],
  forbidden: Map<string, Set<string>>,
  timeBudgetMs = BACKTRACK_TIME_BUDGET_MS,
): string[] | null {
  const deadline = Date.now() + timeBudgetMs;
  const assignment = new Map<string, string>();
  const assignedGivers = new Set<string>();
  const remainingReceivers = new Set(participantIds);

  function pickNextGiver(): { giver: string; options: string[] } | null {
    let bestGiver: string | null = null;
    let bestOptions: string[] = [];
    for (const giver of participantIds) {
      if (assignedGivers.has(giver)) continue;
      const options: string[] = [];
      for (const receiver of remainingReceivers) {
        if (!forbidden.get(giver)?.has(receiver)) options.push(receiver);
      }
      if (bestGiver === null || options.length < bestOptions.length) {
        bestGiver = giver;
        bestOptions = options;
        if (options.length === 0) break;
      }
    }
    return bestGiver === null ? null : { giver: bestGiver, options: bestOptions };
  }

  function backtrack(): boolean {
    if (Date.now() > deadline) return false;
    if (assignedGivers.size === participantIds.length) return true;

    const next = pickNextGiver();
    if (!next || next.options.length === 0) return false;

    for (const receiver of fisherYatesShuffle(next.options)) {
      assignment.set(next.giver, receiver);
      assignedGivers.add(next.giver);
      remainingReceivers.delete(receiver);

      if (backtrack()) return true;

      assignedGivers.delete(next.giver);
      remainingReceivers.add(receiver);
      assignment.delete(next.giver);

      if (Date.now() > deadline) return false;
    }
    return false;
  }

  if (!backtrack()) return null;
  return participantIds.map((giver) => assignment.get(giver)!);
}

/**
 * Matching bipartido máximo (algoritmo de Kuhn — augmenting paths), usado
 * como prova de factibilidade e fallback determinístico final. Trivial em
 * performance para o tamanho esperado (até ~100 participantes).
 */
function findMaximumMatching(
  givers: readonly string[],
  receivers: readonly string[],
  forbidden: Map<string, Set<string>>,
): { matching: Map<string, string>; unmatchedGivers: string[] } {
  const receiverOwner = new Map<string, string>(); // receiver -> giver

  function tryAugment(giver: string, visited: Set<string>): boolean {
    for (const receiver of receivers) {
      if (forbidden.get(giver)?.has(receiver)) continue;
      if (visited.has(receiver)) continue;
      visited.add(receiver);

      const currentOwner = receiverOwner.get(receiver);
      if (currentOwner === undefined || tryAugment(currentOwner, visited)) {
        receiverOwner.set(receiver, giver);
        return true;
      }
    }
    return false;
  }

  const unmatchedGivers: string[] = [];
  for (const giver of givers) {
    if (!tryAugment(giver, new Set())) {
      unmatchedGivers.push(giver);
    }
  }

  const matching = new Map<string, string>();
  for (const [receiver, giver] of receiverOwner) {
    matching.set(giver, receiver);
  }

  return { matching, unmatchedGivers };
}

/**
 * Sorteia uma atribuição válida (derangement + exclusões) em três camadas:
 * shuffle aleatório -> backtracking com MRV -> matching bipartido máximo
 * (prova de (in)viabilidade). Nunca retorna um resultado parcial: ou a
 * atribuição é completa e válida, ou é inviável.
 */
export function runDerangementDraw(
  participantIds: readonly string[],
  exclusions: ExclusionInput[],
): DrawOutcome {
  if (participantIds.length < 3) {
    throw new Error("runDerangementDraw requires at least 3 participants");
  }

  const forbidden = buildForbiddenMap(participantIds, exclusions);

  const randomResult = tryRandomShuffle(participantIds, forbidden);
  if (randomResult) {
    return { ok: true, assignments: zip(participantIds, randomResult) };
  }

  const backtrackResult = backtrackWithMrv(participantIds, forbidden);
  if (backtrackResult) {
    return { ok: true, assignments: zip(participantIds, backtrackResult) };
  }

  const shuffledGivers = fisherYatesShuffle(participantIds);
  const shuffledReceivers = fisherYatesShuffle(participantIds);
  const { matching, unmatchedGivers } = findMaximumMatching(
    shuffledGivers,
    shuffledReceivers,
    forbidden,
  );

  if (unmatchedGivers.length > 0) {
    return { ok: false, reason: "INFEASIBLE", overConstrainedParticipantIds: unmatchedGivers };
  }

  return { ok: true, assignments: matching };
}
