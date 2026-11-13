import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireMethod, verifyAuth } from "../../_lib/auth";
import { requireQueryParam, withErrorHandling } from "../../_lib/http";
import { loadPartyOrThrow, requirePartyOwnerOrAdmin } from "../../_lib/party";

/**
 * GET /api/parties/:id — detalhe completo pra tela do owner/admin: dados da
 * party, categorias e participantes (sem nunca tocar em assignments/tokens).
 */
export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
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
    categories: categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    participants: participantsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    exclusions: exclusionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  });
});
