import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Participant } from "../../../shared/types.js";
import { requireMethod, verifyAuth } from "../../_lib/auth.js";
import { requireQueryParam, withErrorHandling } from "../../_lib/http.js";
import { effectiveRsvp, loadPartyOrThrow, requirePartyOwnerOrAdmin } from "../../_lib/party.js";

/**
 * GET /api/parties/:id — detalhe completo pra tela do owner/admin: dados da
 * party, categorias e participantes (sem nunca tocar em assignments/tokens).
 */
export const getPartyDetail = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["GET"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const { ref, party } = await loadPartyOrThrow(partyId);
  requirePartyOwnerOrAdmin(party, decoded);

  const [categoriesSnap, participantsSnap, exclusionsSnap] = await Promise.all([
    ref.collection("categories").get(),
    ref.collection("participants").get(),
    ref.collection("exclusions").get(),
  ]);

  res.status(200).json({
    id: partyId,
    ...party,
    // Quem criou a party (não um admin só gerenciando) também é participante
    // dela — usado pra mostrar a aba "Meu presente" só pra essa pessoa.
    isOwner: party.ownerUid === decoded.uid,
    categories: categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    participants: participantsSnap.docs.map((d) => {
      const data = d.data() as Participant;
      return { id: d.id, ...data, rsvp: effectiveRsvp(data) };
    }),
    exclusions: exclusionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  });
});
