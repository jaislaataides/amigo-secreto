import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import {
  decryptAssignment,
  unwrapDek,
  verifyPossessionToken,
  type EncryptedAssignmentPayload,
} from "./_lib/crypto/envelope.js";
import { ApiError, normalizeEmail, requireMethod, verifyAuth } from "./_lib/auth.js";
import { readJsonBody, requireString, withErrorHandling } from "./_lib/http.js";
import { loadPartyOrThrow } from "./_lib/party.js";
import type { DekMeta, Participant, PossessionToken } from "../shared/types.js";

interface RevealBody {
  partyId: string;
  participantId: string;
  token: string;
}

/**
 * Único ponto de leitura de `assignments` em todo o sistema. Exige DUAS
 * provas independentes de identidade antes de descriptografar: o e-mail
 * autenticado tem que bater com o do participante, E o token de posse (que
 * só chega no e-mail de revelação) tem que bater com o hash salvo. Qualquer
 * uma falhando, a mensagem de erro é a mesma — não dá pra descobrir qual
 * delas falhou tentando adivinhar.
 */
export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  const body = readJsonBody<RevealBody>(req);
  const partyId = requireString(body.partyId, "partyId");
  const participantId = requireString(body.participantId, "participantId");
  const token = requireString(body.token, "token");

  const genericError = () =>
    new ApiError(403, "invalid-reveal", "Link inválido, expirado, ou você não tem permissão para ver este resultado.");

  const { ref: partyRef, party } = await loadPartyOrThrow(partyId);
  if (party.status !== "drawn") {
    throw genericError();
  }

  const participantRef = partyRef.collection("participants").doc(participantId);
  const [participantSnap, tokenSnap] = await Promise.all([
    participantRef.get(),
    partyRef.collection("possessionTokens").doc(participantId).get(),
  ]);

  // E-mail só vale como prova se o provedor o verificou (ver requireVerifiedEmail).
  if (!participantSnap.exists || !tokenSnap.exists || !decoded.email || decoded.email_verified !== true) {
    throw genericError();
  }

  const participant = participantSnap.data() as Participant;
  const possession = tokenSnap.data() as PossessionToken;

  const emailMatches = normalizeEmail(decoded.email) === participant.email;
  const tokenMatches = verifyPossessionToken(token, possession.tokenHash);
  if (!emailMatches || !tokenMatches) {
    throw genericError();
  }

  const assignmentSnap = await partyRef.collection("assignments").doc(participantId).get();
  const dekMetaSnap = await partyRef.collection("dekMeta").doc("current").get();
  if (!assignmentSnap.exists || !dekMetaSnap.exists) {
    throw genericError();
  }

  const dek = unwrapDek(dekMetaSnap.data() as DekMeta);
  const receiverParticipantId = decryptAssignment(
    dek,
    partyId,
    participantId,
    assignmentSnap.data() as EncryptedAssignmentPayload,
  );

  const [receiverSnap, receiverLinksSnap, categoriesSnap] = await Promise.all([
    partyRef.collection("participants").doc(receiverParticipantId).get(),
    partyRef.collection("participants").doc(receiverParticipantId).collection("referenceLinks").get(),
    partyRef.collection("categories").get(),
  ]);

  if (!receiverSnap.exists) {
    throw genericError();
  }
  const receiver = receiverSnap.data() as Participant;
  const categoryLabels = new Map(categoriesSnap.docs.map((d) => [d.id, d.data().label as string]));

  await Promise.all([
    assignmentSnap.ref.update({ revealCount: FieldValue.increment(1) }),
    tokenSnap.ref.update({ usedCount: FieldValue.increment(1), lastUsedAt: FieldValue.serverTimestamp() }),
  ]);

  res.status(200).json({
    receiverName: receiver.name,
    receiverCategories: receiver.preferredCategories.map((id) => categoryLabels.get(id) ?? id),
    referenceLinks: receiverLinksSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  });
});
