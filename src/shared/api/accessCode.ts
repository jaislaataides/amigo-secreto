/**
 * Código de acesso do participante, que chega no link do convite
 * (`?t=...`). Só é necessário na PRIMEIRA abertura: o servidor vincula a
 * conta logada ao participante e, dali em diante, o login basta. Por isso
 * fica só na sessão desta aba (não persiste no aparelho).
 */
const key = (partyId: string) => `amico:access:${partyId}`;

export function saveAccessCode(partyId: string, code: string) {
  try {
    sessionStorage.setItem(key(partyId), code);
  } catch {
    // Armazenamento bloqueado: vale só enquanto a página estiver aberta.
    memory.set(partyId, code);
  }
}

export function getAccessCode(partyId: string): string | null {
  try {
    return sessionStorage.getItem(key(partyId)) ?? memory.get(partyId) ?? null;
  } catch {
    return memory.get(partyId) ?? null;
  }
}

const memory = new Map<string, string>();

/** Rotas do participante: /api/parties/:id/me e subrotas. */
const PARTICIPANT_ROUTE = /^\/api\/parties\/([^/?]+)\/me(?:[/?]|$)/;

export function accessCodeHeaderFor(path: string): Record<string, string> {
  const partyId = PARTICIPANT_ROUTE.exec(path)?.[1];
  const code = partyId ? getAccessCode(partyId) : null;
  return code ? { "X-Access-Token": code } : {};
}
