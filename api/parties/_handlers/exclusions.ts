import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import type { ExclusionType } from "../../../shared/types";
import { ApiError, requireMethod, verifyAuth } from "../../_lib/auth";
import { readJsonBody, requireQueryParam, withErrorHandling } from "../../_lib/http";
import { loadPartyOrThrow, requirePartyOwnerOrAdmin } from "../../_lib/party";

interface ExclusionInputBody {
  type: ExclusionType;
  participantIds: string[];
}

interface SetExclusionsBody {
  exclusions: ExclusionInputBody[];
}

/** PUT /api/parties/:id/exclusions — substitui a lista inteira de exclusões. */
export const setExclusions = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["PUT"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const { ref, party } = await loadPartyOrThrow(partyId);
  requirePartyOwnerOrAdmin(party, decoded);

  if (party.status === "drawn" || party.status === "canceled") {
    throw new ApiError(409, "party-locked", "Não é possível editar exclusões depois do sorteio.");
  }

  const body = readJsonBody<SetExclusionsBody>(req);
  if (!Array.isArray(body.exclusions)) {
    throw new ApiError(400, "invalid-body", "exclusions deve ser uma lista.");
  }

  const participantsSnap = await ref.collection("participants").get();
  const validIds = new Set(participantsSnap.docs.map((d) => d.id));

  for (const exclusion of body.exclusions) {
    if (exclusion.type !== "pair" && exclusion.type !== "group") {
      throw new ApiError(400, "invalid-body", "type deve ser 'pair' ou 'group'.");
    }
    if (!Array.isArray(exclusion.participantIds) || exclusion.participantIds.length < 2) {
      throw new ApiError(400, "invalid-body", "Cada exclusão precisa de ao menos 2 participantes.");
    }
    if (exclusion.type === "pair" && exclusion.participantIds.length !== 2) {
      throw new ApiError(400, "invalid-body", "Exclusões do tipo 'pair' precisam de exatamente 2 participantes.");
    }
    for (const id of exclusion.participantIds) {
      if (!validIds.has(id)) {
        throw new ApiError(400, "invalid-body", `Participante inválido na exclusão: ${id}.`);
      }
    }
  }

  const existingExclusions = await ref.collection("exclusions").get();
  const batch = ref.firestore.batch();
  for (const doc of existingExclusions.docs) batch.delete(doc.ref);

  const now = FieldValue.serverTimestamp();
  for (const exclusion of body.exclusions) {
    batch.set(ref.collection("exclusions").doc(), {
      type: exclusion.type,
      participantIds: exclusion.participantIds,
      createdAt: now,
    });
  }

  await batch.commit();

  res.status(200).json({ count: body.exclusions.length });
});
