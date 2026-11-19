import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { enqueueAndSend } from "../../_lib/mail/send.js";
import { ApiError, requireMethod, verifyAuth } from "../../_lib/auth.js";
import { readJsonBody, requireQueryParam, withErrorHandling } from "../../_lib/http.js";
import { loadPartyOrThrow, requireParticipantAccess } from "../../_lib/party.js";

interface ConfirmBody {
  rsvp: "going" | "not_going";
}

export const confirmRsvp = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const { ref, party } = await loadPartyOrThrow(partyId);
  const { doc, participant } = await requireParticipantAccess(req, ref, party, decoded);

  const body = readJsonBody<ConfirmBody>(req);
  if (body.rsvp !== "going" && body.rsvp !== "not_going") {
    throw new ApiError(400, "invalid-body", "rsvp deve ser 'going' ou 'not_going'.");
  }

  await doc.ref.update({
    rsvp: body.rsvp,
    rsvpAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const allParticipants = await ref.collection("participants").get();
  const stillPending = allParticipants.docs.some((d) => {
    const data = d.data();
    return d.id === doc.id ? false : data.rsvp === "pending";
  });
  if (!stillPending && party.status === "collecting") {
    await ref.update({ status: "ready_to_draw", updatedAt: FieldValue.serverTimestamp() });
  }

  try {
    await enqueueAndSend({
      template: "rsvp_ack",
      to: participant.email,
      partyId,
      participantId: doc.id,
      payload: { participantName: participant.name, partyName: party.name, rsvp: body.rsvp },
    });
  } catch {
    // Confirmação já foi gravada; falha de e-mail não deve bloquear o RSVP.
  }

  res.status(200).json({ rsvp: body.rsvp });
});
