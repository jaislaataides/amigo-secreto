import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../../_lib/firebaseAdmin";
import { ApiError, requireMethod, verifyAuth } from "../../_lib/auth";
import { readJsonBody, requireQueryParam, withErrorHandling } from "../../_lib/http";
import { loadPartyOrThrow, requirePartyOwnerOrAdmin } from "../../_lib/party";

interface UpdateRulesBody {
  name?: string;
  description?: string;
  valueMin?: number;
  valueMax?: number;
  forbiddenItemsText?: string;
  rsvpDeadline?: string;
  addCustomCategories?: string[];
  removeCategoryIds?: string[];
}

export const updateRules = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const { ref, party } = await loadPartyOrThrow(partyId);
  requirePartyOwnerOrAdmin(party, decoded);

  if (party.status === "drawn" || party.status === "canceled") {
    throw new ApiError(409, "party-locked", "Não é possível editar uma party já sorteada ou cancelada.");
  }

  const body = readJsonBody<UpdateRulesBody>(req);
  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

  if (body.name !== undefined) {
    if (!body.name.trim()) throw new ApiError(400, "invalid-body", "name não pode ser vazio.");
    updates.name = body.name.trim();
  }
  if (body.description !== undefined) updates.description = body.description.trim();
  if (body.forbiddenItemsText !== undefined) updates.forbiddenItemsText = body.forbiddenItemsText.trim();

  if (body.valueMin !== undefined || body.valueMax !== undefined) {
    const min = body.valueMin ?? party.valueRange.min;
    const max = body.valueMax ?? party.valueRange.max;
    if (min > max) throw new ApiError(400, "invalid-body", "valueMin não pode ser maior que valueMax.");
    updates.valueRange = { min, max, currency: "BRL" };
  }

  if (body.rsvpDeadline !== undefined) {
    const date = new Date(body.rsvpDeadline);
    if (Number.isNaN(date.getTime())) {
      throw new ApiError(400, "invalid-body", "rsvpDeadline inválida.");
    }
    updates.rsvpDeadline = Timestamp.fromDate(date);
  }

  const batch = adminDb.batch();
  batch.update(ref, updates);

  for (const label of body.addCustomCategories ?? []) {
    const trimmed = label.trim();
    if (!trimmed) continue;
    batch.set(ref.collection("categories").doc(), {
      label: trimmed,
      isCustom: true,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  for (const categoryId of body.removeCategoryIds ?? []) {
    batch.delete(ref.collection("categories").doc(categoryId));
  }

  await batch.commit();

  res.status(200).json({ ok: true });
});
