import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireMethod, verifyAuth } from "../../_lib/auth.js";
import { requireQueryParam, withErrorHandling } from "../../_lib/http.js";
import { effectiveRsvp, loadPartyOrThrow, requireParticipantAccess } from "../../_lib/party.js";
import type { Participant } from "../../../shared/types.js";

/**
 * GET /api/parties/:id/me — visão do participante: dados públicos da party
 * (nunca o que outro participante escolheu) + o próprio cadastro + refs.
 */
export const getMe = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["GET"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const { ref, party } = await loadPartyOrThrow(partyId);
  const { doc, participant } = await requireParticipantAccess(req, ref, party, decoded);

  const [categoriesSnap, linksSnap, participantsSnap] = await Promise.all([
    ref.collection("categories").get(),
    doc.ref.collection("referenceLinks").get(),
    ref.collection("participants").get(),
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
      // Só nome, nunca e-mail/categorias/medidas de outro participante —
      // só quem efetivamente vai (ver effectiveRsvp), que é quem entrou no
      // sorteio.
      participants: participantsSnap.docs
        .map((d) => d.data() as Participant)
        .filter((p) => effectiveRsvp(p) === "going")
        .map((p) => ({ name: p.name })),
    },
    me: {
      id: doc.id,
      name: participant.name,
      email: participant.email,
      isOwner: participant.isOwner === true,
      rsvp: effectiveRsvp(participant),
      preferredCategories: participant.preferredCategories,
      sizes: participant.sizes ?? null,
      referenceLinks: linksSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    },
  });
});
