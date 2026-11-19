/**
 * Código de acesso do participante, que chega no link do convite
 * (`?t=...`). Fica guardado neste aparelho, por party, pra que as abas e os
 * cards de "Minhas parties" continuem abrindo sem precisar do e-mail de
 * novo. Sozinho ele não abre nada: o servidor também exige estar logado
 * com o e-mail do participante.
 */
const key = (partyId: string) => `amico:access:${partyId}`;

export function saveAccessCode(partyId: string, code: string) {
  try {
    localStorage.setItem(key(partyId), code);
  } catch {
    // Armazenamento bloqueado (aba anônima etc.): vale só pra esta visita.
    memory.set(partyId, code);
  }
}

export function getAccessCode(partyId: string): string | null {
  try {
    return localStorage.getItem(key(partyId)) ?? memory.get(partyId) ?? null;
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
