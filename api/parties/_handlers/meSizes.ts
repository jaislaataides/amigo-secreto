import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { ApiError, requireMethod, verifyAuth } from "../../_lib/auth.js";
import { readJsonBody, requireQueryParam, withErrorHandling } from "../../_lib/http.js";
import { loadPartyOrThrow, requireParticipantAccess } from "../../_lib/party.js";
import type { Sizes } from "../../../shared/types.js";

const MAX_LENGTH = 16;
const SIZE_FIELDS: (keyof Sizes)[] = ["top", "bottom", "shoe", "sock"];

/**
 * POST /api/parties/:id/me/sizes — medidas do participante (camisa/blusa,
 * calça/shorts, sapato, meia). Todas opcionais e texto livre curto ("M",
 * "42", "39–42"); quem tirou a pessoa vê na revelação. Só faz sentido pra
 * quem confirmou presença.
 */
export const setMySizes = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const { ref, party } = await loadPartyOrThrow(partyId);
  const { doc, participant } = await requireParticipantAccess(req, ref, party, decoded);

  if (participant.rsvp !== "going") {
    throw new ApiError(409, "not-going", "Confirme sua presença antes de informar as medidas.");
  }

  const body = readJsonBody<Partial<Record<keyof Sizes, unknown>>>(req);
  const sizes = {} as Sizes;
  for (const field of SIZE_FIELDS) {
    const raw = body[field];
    if (raw !== undefined && raw !== null && typeof raw !== "string") {
      throw new ApiError(400, "invalid-body", `${field} deve ser texto.`);
    }
    const value = typeof raw === "string" ? raw.trim().slice(0, MAX_LENGTH) : "";
    sizes[field] = value || null;
  }

  await doc.ref.update({ sizes, updatedAt: FieldValue.serverTimestamp() });

  res.status(200).json({ sizes });
});
