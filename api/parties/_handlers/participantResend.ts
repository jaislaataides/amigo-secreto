import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { enqueueAndSend } from "../../_lib/mail/send.js";
import { ApiError, requireMethod, verifyAuth } from "../../_lib/auth.js";
import { requireQueryParam, withErrorHandling } from "../../_lib/http.js";
import { issueAccessToken, loadPartyOrThrow, requirePartyOwnerOrAdmin } from "../../_lib/party.js";
import type { Participant } from "../../../shared/types.js";

/**
 * POST /api/parties/:id/participants/:pid/resend — gera um código de acesso
 * novo pro participante e reenvia o convite. O link anterior para de
 * funcionar. Serve pra quem foi convidado antes dos links com código, pra
 * convite que falhou, ou se a pessoa perdeu o e-mail.
 */
export const resendInvite = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const participantId = requireQueryParam(req, "pid");
  const { ref, party } = await loadPartyOrThrow(partyId);
  requirePartyOwnerOrAdmin(party, decoded);

  if (party.status === "canceled") {
    throw new ApiError(409, "party-locked", "Esta party foi cancelada.");
  }

  const participantRef = ref.collection("participants").doc(participantId);
  const snap = await participantRef.get();
  if (!snap.exists) {
    throw new ApiError(404, "not-found", "Participante não encontrado.");
  }
  const participant = snap.data() as Participant;
  if (participant.isOwner) {
    throw new ApiError(400, "is-owner", "O organizador entra pela própria conta, sem convite.");
  }

  const nonce = await issueAccessToken(ref, participantId);
  const sent = await enqueueAndSend({
    template: "invite",
    to: participant.email,
    partyId,
    participantId,
    payload: { participantName: participant.name, partyName: party.name, link: { purpose: "access", nonce } },
  });
  await participantRef.update({ inviteStatus: sent ? "sent" : "failed", updatedAt: FieldValue.serverTimestamp() });
  if (!sent) {
    throw new ApiError(502, "mail-failed", "Não foi possível enviar o e-mail agora. Tente de novo em instantes.");
  }

  res.status(200).json({ ok: true });
});
