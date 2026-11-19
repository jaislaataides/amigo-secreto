import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiError, requireMethod, verifyAuth } from "../../_lib/auth.js";
import { requireQueryParam, withErrorHandling } from "../../_lib/http.js";
import { loadPartyOrThrow, requirePartyOwnerOrAdmin } from "../../_lib/party.js";

export const removeParticipant = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["DELETE"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const participantId = requireQueryParam(req, "pid");
  const { ref, party } = await loadPartyOrThrow(partyId);
  requirePartyOwnerOrAdmin(party, decoded);

  if (party.status === "drawn" || party.status === "canceled") {
    throw new ApiError(409, "party-locked", "Não é possível remover participantes depois do sorteio.");
  }

  const participantRef = ref.collection("participants").doc(participantId);
  const snap = await participantRef.get();
  if (!snap.exists) {
    throw new ApiError(404, "not-found", "Participante não encontrado.");
  }

  const linksSnap = await participantRef.collection("referenceLinks").get();
  const batch = ref.firestore.batch();
  for (const link of linksSnap.docs) batch.delete(link.ref);
  batch.delete(participantRef);
  await batch.commit();

  res.status(200).json({ ok: true });
});
