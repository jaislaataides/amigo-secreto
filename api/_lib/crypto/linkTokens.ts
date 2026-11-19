import { createHmac, randomBytes } from "node:crypto";
import { deriveSubkey, hashPossessionToken, verifyPossessionToken } from "./envelope.js";

/**
 * Códigos dos links enviados por e-mail (acesso do participante e
 * revelação).
 *
 * O código NUNCA é guardado: o Firestore só tem um `nonce` aleatório e o
 * hash SHA-256 do código. O código em si é um HMAC da subchave de links
 * (derivada da KEK, que só existe em variável de ambiente) sobre
 * propósito + party + participante + nonce. Assim:
 *   - quem lê o banco (console, backup, vazamento) não consegue montar um
 *     link válido sem a KEK;
 *   - o servidor consegue remontar o mesmo link pra lembretes e reenvios
 *     de e-mail sem nunca ter persistido o código;
 *   - gerar um nonce novo invalida o link anterior (reenvio de convite).
 */
export type LinkPurpose = "access" | "reveal";

const LINK_KEY_INFO = "amico-secreto/link-token/v1";

export function newLinkNonce(): string {
  return randomBytes(16).toString("base64url");
}

export function deriveLinkToken(purpose: LinkPurpose, partyId: string, participantId: string, nonce: string): string {
  return createHmac("sha256", deriveSubkey(LINK_KEY_INFO))
    .update(`${purpose}:${partyId}:${participantId}:${nonce}`, "utf8")
    .digest("base64url");
}

/** Nonce novo + hash do código derivado dele (o que vai pro Firestore). */
export function issueLinkToken(purpose: LinkPurpose, partyId: string, participantId: string) {
  const nonce = newLinkNonce();
  const token = deriveLinkToken(purpose, partyId, participantId, nonce);
  return { nonce, token, tokenHash: hashPossessionToken(token) };
}

export function verifyLinkToken(token: string, storedHash: string): boolean {
  return verifyPossessionToken(token, storedHash);
}
