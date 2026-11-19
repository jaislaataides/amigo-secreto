import type { DocumentReference, DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminDb } from "./firebaseAdmin.js";
import { ApiError, normalizeEmail } from "./auth.js";
import type { Participant, Party } from "../../shared/types.js";

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
  if (!decoded.email) {
    throw new ApiError(400, "no-email", "Sua conta Google não tem e-mail.");
  }
  const email = normalizeEmail(decoded.email);

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
