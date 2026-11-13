import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { ApiError, requireMethod, verifyAuth } from "../../../_lib/auth";
import { readJsonBody, requireQueryParam, withErrorHandling } from "../../../_lib/http";
import { findMyParticipantOrThrow, loadPartyOrThrow } from "../../../_lib/party";

interface PreferencesBody {
  categoryIds: string[];
}

export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const { ref } = await loadPartyOrThrow(partyId);
  const { doc } = await findMyParticipantOrThrow(ref, decoded);

  const body = readJsonBody<PreferencesBody>(req);
  if (!Array.isArray(body.categoryIds)) {
    throw new ApiError(400, "invalid-body", "categoryIds deve ser uma lista.");
  }

  const categoriesSnap = await ref.collection("categories").get();
  const validIds = new Set(categoriesSnap.docs.map((d) => d.id));
  for (const id of body.categoryIds) {
    if (!validIds.has(id)) {
      throw new ApiError(400, "invalid-body", `Categoria inválida: ${id}.`);
    }
  }

  await doc.ref.update({
    preferredCategories: body.categoryIds,
    updatedAt: FieldValue.serverTimestamp(),
  });

  res.status(200).json({ ok: true });
});
