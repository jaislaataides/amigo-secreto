import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { ApiError, requireAdmin, requireMethod, verifyAuth } from "../../_lib/auth";
import { readJsonBody, requireQueryParam, withErrorHandling } from "../../_lib/http";
import { loadPartyOrThrow } from "../../_lib/party";

interface SetMaxParticipantsBody {
  maxParticipants: number;
}

export const setMaxParticipants = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  requireAdmin(decoded);

  const partyId = requireQueryParam(req, "id");
  const { ref } = await loadPartyOrThrow(partyId);

  const body = readJsonBody<SetMaxParticipantsBody>(req);
  if (!Number.isInteger(body.maxParticipants) || body.maxParticipants < 1) {
    throw new ApiError(400, "invalid-body", "maxParticipants deve ser um inteiro positivo.");
  }

  const currentCount = (await ref.collection("participants").count().get()).data().count;
  if (body.maxParticipants < currentCount) {
    throw new ApiError(
      409,
      "below-current-count",
      `Já existem ${currentCount} participantes cadastrados — não é possível definir um limite menor.`,
    );
  }

  await ref.update({ maxParticipants: body.maxParticipants, updatedAt: FieldValue.serverTimestamp() });

  res.status(200).json({ maxParticipants: body.maxParticipants });
});
