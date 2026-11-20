import type { VercelRequest, VercelResponse } from "@vercel/node";
import { enqueueAndSend } from "../../_lib/mail/send.js";
import { ApiError, requireMethod, verifyAuth } from "../../_lib/auth.js";
import { requireQueryParam, withErrorHandling } from "../../_lib/http.js";
import { effectiveRsvp, loadPartyOrThrow, requirePartyOwnerOrAdmin } from "../../_lib/party.js";
import type { Participant, PossessionToken } from "../../../shared/types.js";

/**
 * POST /api/parties/:id/resend-results — reenvia o e-mail de revelação pra
 * todo mundo que participou do sorteio de uma vez só (mesmo link de sempre,
 * sem invalidar nada — ver participantResend.ts pro reenvio individual).
 */
export const resendResults = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const { ref, party } = await loadPartyOrThrow(partyId);
  requirePartyOwnerOrAdmin(party, decoded);

  if (party.status !== "drawn") {
    throw new ApiError(409, "not-drawn", "Essa party ainda não foi sorteada.");
  }

  const [participantsSnap, tokensSnap] = await Promise.all([
    ref.collection("participants").get(),
    ref.collection("possessionTokens").get(),
  ]);

  const nonceByParticipantId = new Map<string, string>();
  for (const doc of tokensSnap.docs) {
    const nonce = (doc.data() as PossessionToken).nonce;
    if (nonce) nonceByParticipantId.set(doc.id, nonce);
  }

  const going = participantsSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Participant) }))
    .filter((p) => effectiveRsvp(p) === "going" && nonceByParticipantId.has(p.id));

  let sentCount = 0;
  await Promise.all(
    going.map(async (p) => {
      const nonce = nonceByParticipantId.get(p.id);
      if (!nonce) return;
      const sent = await enqueueAndSend({
        template: "reveal_link",
        to: p.email,
        partyId,
        participantId: p.id,
        payload: { participantName: p.name, partyName: party.name, link: { purpose: "reveal", nonce } },
      });
      if (sent) sentCount += 1;
    }),
  );

  res.status(200).json({ ok: true, sentCount, totalCount: going.length });
});
