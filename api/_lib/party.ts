import type { VercelRequest } from "@vercel/node";
import { FieldValue, type DocumentReference, type DocumentSnapshot, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { issueLinkToken, verifyLinkToken } from "./crypto/linkTokens.js";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminDb } from "./firebaseAdmin.js";
import { ApiError, requireVerifiedEmail } from "./auth.js";
import type { Participant, Party, Rsvp } from "../../shared/types.js";

export async function loadPartyOrThrow(
  partyId: string,
): Promise<{ ref: DocumentReference; snapshot: DocumentSnapshot; party: Party }> {
  const ref = adminDb.collection("parties").doc(partyId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new ApiError(404, "not-found", "Party não encontrada.");
  }
  return { ref, snapshot, party: snapshot.data() as Party };
}

export function requirePartyOwnerOrAdmin(party: Party, decoded: DecodedIdToken): void {
  if (party.ownerUid !== decoded.uid && decoded.admin !== true) {
    throw new ApiError(403, "forbidden", "Só o organizador desta party (ou um admin) pode fazer isso.");
  }
}

/**
 * Resolve o participante do usuário autenticado dentro de uma party pelo
 * e-mail do ID token — participantes nunca conhecem seu próprio
 * `participantId` de antemão, então toda rota "/me" passa por aqui.
 */
export async function findMyParticipantOrThrow(
  partyRef: DocumentReference,
  decoded: DecodedIdToken,
): Promise<{ doc: QueryDocumentSnapshot; participant: Participant }> {
  const email = requireVerifiedEmail(decoded);

  const snapshot = await partyRef.collection("participants").where("email", "==", email).limit(1).get();
  if (snapshot.empty) {
    throw new ApiError(404, "not-a-participant", "Você não está cadastrado como participante desta party.");
  }
  const doc = snapshot.docs[0]!;
  const participant = doc.data() as Participant;

  // Primeiro acesso: vincula o uid ao participante.
  if (participant.uid !== decoded.uid) {
    await doc.ref.set({ uid: decoded.uid }, { merge: true });
    participant.uid = decoded.uid;
  }

  return { doc, participant };
}

/**
 * Gera (ou troca) o código de acesso do participante. Guarda só nonce +
 * hash em `parties/{id}/accessTokens/{participantId}` (bloqueado pra
 * qualquer client nas regras). Devolve o nonce pra montar o link do e-mail;
 * o link anterior deixa de valer.
 */
export async function issueAccessToken(partyRef: DocumentReference, participantId: string): Promise<string> {
  const { nonce, tokenHash } = issueLinkToken("access", partyRef.id, participantId);
  await partyRef.collection("accessTokens").doc(participantId).set({
    nonce,
    tokenHash,
    createdAt: FieldValue.serverTimestamp(),
  });
  return nonce;
}

export const ACCESS_TOKEN_HEADER = "x-access-token";

/**
 * Porta de entrada de toda rota "/me".
 *
 * Primeira vez: exige as DUAS provas — sessão com o e-mail (verificado) do
 * participante E o código do link do convite. Passou, a conta fica
 * vinculada ao participante (`claimedByUid`). Daí em diante basta entrar
 * com essa mesma conta, em qualquer aparelho, sem o link.
 *
 * Isso impede que alguém com a sessão (ou o e-mail) de outra pessoa abra
 * uma party que ela mesma nunca abriu pelo convite, e que um link
 * encaminhado sirva pra outra conta.
 *
 * Exceção: o organizador participando da própria party (isOwner) não
 * recebe convite por e-mail; ele entra só pela sessão de dono.
 *
 * (A revelação do sorteio é outra regra: SEMPRE link + login, ver
 * api/reveal.ts.)
 */
export async function requireParticipantAccess(
  req: VercelRequest,
  partyRef: DocumentReference,
  party: Party,
  decoded: DecodedIdToken,
): Promise<{ doc: QueryDocumentSnapshot; participant: Participant }> {
  const found = await findMyParticipantOrThrow(partyRef, decoded);
  if (found.participant.isOwner === true && party.ownerUid === decoded.uid) {
    return found;
  }
  // Já abriu pelo convite com esta conta antes: o login basta.
  if (found.participant.claimedByUid === decoded.uid) {
    return found;
  }

  const header = req.headers[ACCESS_TOKEN_HEADER];
  const token = Array.isArray(header) ? header[0] : header;
  const linkRequired = () =>
    new ApiError(403, "link-required", "Abra esta party pelo link que chegou no seu e-mail.");
  if (!token) throw linkRequired();

  const tokenSnap = await partyRef.collection("accessTokens").doc(found.doc.id).get();
  const stored = tokenSnap.data() as { tokenHash?: string } | undefined;
  if (!stored?.tokenHash || !verifyLinkToken(token, stored.tokenHash)) throw linkRequired();

  // Primeira abertura válida: vincula a conta ao participante.
  await found.doc.ref.set(
    { claimedByUid: decoded.uid, claimedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  found.participant.claimedByUid = decoded.uid;
  return found;
}

/**
 * O organizador participa por padrão e não recebe convite por e-mail,
 * então não faz sentido ele "confirmar presença": já entra confirmado.
 * Parties antigas criaram o participante do organizador como "pending";
 * aqui ele conta como confirmado mesmo assim. Ele ainda pode recusar
 * (not_going) pela tela de confirmação ou se remover da lista.
 */
export function effectiveRsvp(p: Pick<Participant, "rsvp" | "isOwner">): Rsvp {
  return p.isOwner === true && p.rsvp === "pending" ? "going" : p.rsvp;
}
