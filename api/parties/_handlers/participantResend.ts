import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { enqueueAndSend } from "../../_lib/mail/send.js";
import { ApiError, requireMethod, verifyAuth } from "../../_lib/auth.js";
import { requireQueryParam, withErrorHandling } from "../../_lib/http.js";
import { issueAccessToken, loadPartyOrThrow, requirePartyOwnerOrAdmin } from "../../_lib/party.js";
import type { Participant, PossessionToken } from "../../../shared/types.js";

/**
 * POST /api/parties/:id/participants/:pid/resend — antes do sorteio, gera um
 * código de acesso novo e reenvia o convite (o link anterior para de
 * funcionar). Depois do sorteio, reenvia o e-mail de REVELAÇÃO em vez disso
 * — convite não faz mais sentido com a party já sorteada, e o link do
 * resultado usa o nonce que já existe (não precisa gerar outro).
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

  if (party.status === "drawn") {
    const tokenSnap = await ref.collection("possessionTokens").doc(participantId).get();
    const { nonce } = (tokenSnap.data() as PossessionToken | undefined) ?? {};
    if (!nonce) {
      throw new ApiError(409, "no-result", "Essa pessoa não participou do sorteio.");
    }
    const sent = await enqueueAndSend({
      template: "reveal_link",
      to: participant.email,
      partyId,
      participantId,
      payload: { participantName: participant.name, partyName: party.name, link: { purpose: "reveal", nonce } },
    });
    if (!sent) {
      throw new ApiError(502, "mail-failed", "Não foi possível enviar o e-mail agora. Tente de novo em instantes.");
    }
    res.status(200).json({ ok: true });
    return;
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
