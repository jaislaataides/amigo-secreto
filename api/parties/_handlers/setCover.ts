import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { validateImageDataUrl } from "../../_lib/image.js";
import { ApiError, requireMethod, verifyAuth } from "../../_lib/auth.js";
import { readJsonBody, requireQueryParam, withErrorHandling } from "../../_lib/http.js";
import { loadPartyOrThrow, requirePartyOwnerOrAdmin } from "../../_lib/party.js";

interface SetCoverBody {
  imageDataUrl: string | null;
}

/**
 * Grava (ou remove, se imageDataUrl for null) a capa da party, direto como
 * data URI no documento — ver api/_lib/image.ts pro porquê de não usar
 * Firebase Storage aqui.
 */
export const setCover = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const { ref, party } = await loadPartyOrThrow(partyId);
  requirePartyOwnerOrAdmin(party, decoded);

  if (party.status === "drawn" || party.status === "canceled") {
    throw new ApiError(409, "party-locked", "Não é possível editar uma party já sorteada ou cancelada.");
  }

  const body = readJsonBody<SetCoverBody>(req);
  const imageUrl = body.imageDataUrl === null ? null : validateImageDataUrl(body.imageDataUrl);

  await ref.update({ imageUrl, updatedAt: FieldValue.serverTimestamp() });

  res.status(200).json({ ok: true });
});
