import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireMethod, verifyAuth } from "../../../_lib/auth";
import { requireQueryParam, withErrorHandling } from "../../../_lib/http";
import { findMyParticipantOrThrow, loadPartyOrThrow } from "../../../_lib/party";

/**
 * GET /api/parties/:id/me — visão do participante: dados públicos da party
 * (nunca o que outro participante escolheu) + o próprio cadastro + refs.
 */
export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["GET"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const { ref, party } = await loadPartyOrThrow(partyId);
  const { doc, participant } = await findMyParticipantOrThrow(ref, decoded);

  const [categoriesSnap, linksSnap] = await Promise.all([
    ref.collection("categories").get(),
    doc.ref.collection("referenceLinks").get(),
  ]);

  res.status(200).json({
    party: {
      id: partyId,
      name: party.name,
      description: party.description,
      imageUrl: party.imageUrl,
      valueRange: party.valueRange,
      forbiddenItemsText: party.forbiddenItemsText,
      status: party.status,
      rsvpDeadline: party.rsvpDeadline,
      categories: categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    },
    me: {
      id: doc.id,
      name: participant.name,
      email: participant.email,
      rsvp: participant.rsvp,
      preferredCategories: participant.preferredCategories,
      referenceLinks: linksSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    },
  });
});
